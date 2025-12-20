import { action, makeObservable, observable, reaction, runInAction } from 'mobx';
import { ProposalOpenContract } from '@deriv/api-types';
import RootStore from './root-store';
import { getAppId } from '@/components/shared';

export type TCopyAccount = {
    token: string;
    type: 'Source' | 'Target';
    status: 'Connected' | 'Pending' | 'Error';
    account_type: string;
    balance: string;
    currency: string;
    ws?: WebSocket;
    profit_loss?: number;
    trades_count?: number;
};

export default class CopyTraderStore {
    root_store: RootStore;
    private _last_mirrored_id: string | number | null = null;

    @observable accessor source_account: TCopyAccount = {
        token: '',
        type: 'Source',
        status: 'Pending',
        account_type: '-',
        balance: '-',
        currency: '-',
    };

    @observable accessor target_accounts: TCopyAccount[] = [
        {
            token: '',
            type: 'Target',
            status: 'Pending',
            account_type: '-',
            balance: '-',
            currency: '-',
        },
    ];

    @observable accessor is_mirroring_internal = false;
    @observable accessor internal_multiplier = 1;

    constructor(root_store: RootStore) {
        makeObservable(this);
        this.root_store = root_store;

        // Reaction for internal mirroring
        reaction(
            () => this.root_store.summary_card.contract_info,
            contract => {
                if (this.is_mirroring_internal && contract) {
                    this.handleSourceTrade(contract);
                }
            }
        );
    }

    @action
    toggleInternalMirroring = () => {
        this.is_mirroring_internal = !this.is_mirroring_internal;
    };

    @action
    setInternalMultiplier = (value: number) => {
        this.internal_multiplier = value;
    };

    @action
    setSourceToken = (token: string) => {
        this.source_account.token = token;
        if (token.length > 10) {
            this.connectAccount(this.source_account);
        }
    };

    @action
    setTargetToken = (index: number, token: string) => {
        if (this.target_accounts[index]) {
            this.target_accounts[index].token = token;
            if (token.length > 10) {
                this.connectAccount(this.target_accounts[index]);
            }
        }
    };

    @action
    connectAccount = (account: TCopyAccount) => {
        if (account.ws) {
            account.ws.close();
        }

        const app_id = getAppId();
        const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);

        account.ws = ws;
        account.status = 'Pending';

        ws.onopen = () => {
            ws.send(JSON.stringify({ authorize: account.token }));
        };

        ws.onmessage = msg => {
            const data = JSON.parse(msg.data);

            if (data.error) {
                runInAction(() => {
                    account.status = 'Error';
                });
                return;
            }

            if (data.msg_type === 'authorize') {
                runInAction(() => {
                    account.status = 'Connected';
                    account.account_type = data.authorize.is_virtual ? 'Demo' : 'Real';
                    account.balance = data.authorize.balance.toLocaleString();
                    account.currency = data.authorize.currency;
                });

                // Subscribe to trades on source
                if (account.type === 'Source') {
                    ws.send(JSON.stringify({ proposal_open_contract: 1, subscribe: 1 }));
                }
            }

            if (data.msg_type === 'proposal_open_contract') {
                this.handleSourceTrade(data.proposal_open_contract);
            }
        };

        ws.onerror = () => {
            runInAction(() => {
                account.status = 'Error';
            });
        };
    };

    @action
    handleSourceTrade = (contract: ProposalOpenContract) => {
        // Debounce/Filter to only mirror new 'open' contracts
        if (contract.status !== 'open' || contract.is_expired) return;

        // Prevent mirroring the same contract ID multiple times
        const contract_id = (contract.contract_id || contract.id) as string | number;
        if (this._last_mirrored_id === contract_id) return;
        this._last_mirrored_id = contract_id;

        console.log('Detected source trade. Mirroring to target accounts...', contract);

        this.target_accounts.forEach(async target => {
            if (target.status === 'Connected' && target.ws) {
                const multiplier = this.is_mirroring_internal ? this.internal_multiplier : 1;
                const original_stake = parseFloat(String(contract.buy_price || contract.stake || contract.amount)) || 1;
                const stake = original_stake * multiplier;

                try {
                    // Step 1: Get proposal on target account
                    const proposal_request = {
                        proposal: 1,
                        amount: stake,
                        basis: 'stake',
                        contract_type: contract.contract_type,
                        currency: target.currency || 'USD',
                        duration: 1,
                        duration_unit: 't',
                        symbol: contract.underlying,
                    };

                    target.ws.send(JSON.stringify(proposal_request));

                    // Wait for proposal response
                    const proposal_response = await new Promise<any>((resolve, reject) => {
                        const handler = (event: MessageEvent) => {
                            const data = JSON.parse(event.data);
                            if (data.msg_type === 'proposal') {
                                target.ws!.removeEventListener('message', handler);
                                resolve(data);
                            } else if (data.error) {
                                target.ws!.removeEventListener('message', handler);
                                reject(data.error);
                            }
                        };
                        target.ws!.addEventListener('message', handler);
                        setTimeout(() => reject(new Error('Proposal timeout')), 5000);
                    });

                    if (proposal_response.error) {
                        console.error('CopyTrader Proposal Error:', proposal_response.error);
                        return;
                    }

                    const proposal_id = proposal_response.proposal?.id;
                    if (!proposal_id) {
                        console.error('CopyTrader: No proposal ID received for target');
                        return;
                    }

                    // Step 2: Buy the contract on target account
                    const buy_request = {
                        buy: proposal_id,
                        price: stake,
                    };

                    target.ws.send(JSON.stringify(buy_request));

                    runInAction(() => {
                        target.trades_count = (target.trades_count || 0) + 1;
                    });

                    console.log(
                        `Sent mirror buy request to target account ${target.token.substring(0, 5)} with stake ${stake}...`
                    );
                } catch (error) {
                    console.error('CopyTrader mirror error:', error);
                }
            }
        });
    };
}
