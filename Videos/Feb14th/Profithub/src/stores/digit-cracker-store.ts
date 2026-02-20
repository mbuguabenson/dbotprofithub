import { action, makeObservable, observable, runInAction } from 'mobx';
import { generateDerivApiInstance, V2GetActiveToken } from '@/external/bot-skeleton/services/api/appId';
import { DigitStatsEngine } from '@/lib/digit-stats-engine';
import { DigitTradeEngine } from '@/lib/digit-trade-engine';
import RootStore from './root-store';

export type TDigitStat = {
    digit: number;
    count: number;
    percentage: number;
    rank: number;
    power: number;
    is_increasing: boolean;
};

export type TAnalysisHistory = {
    type: 'E' | 'O' | 'U' | 'O_U' | 'M' | 'D' | 'R' | 'F';
    value: string | number;
    color: string;
};

export default class DigitCrackerStore {
    root_store: RootStore;
    stats_engine: DigitStatsEngine;
    trade_engine: DigitTradeEngine;
    api: any = null;

    @observable accessor digit_stats: TDigitStat[] = [];
    @observable accessor ticks: number[] = [];
    @observable accessor total_ticks = 1000;
    @observable accessor symbol = 'R_100';
    @observable accessor current_price: string | number = '0.00';
    @observable accessor last_digit: number | null = null;
    @observable accessor is_connected = false;
    @observable accessor is_subscribing = false;
    @observable accessor percentages = {
        even: 50,
        odd: 50,
        over: 50,
        under: 50,
        match: 10,
        differ: 90,
        rise: 50,
        fall: 50,
    };

    @observable accessor even_odd_history: TAnalysisHistory[] = [];
    @observable accessor over_under_history: TAnalysisHistory[] = [];

    @observable accessor markets: { group: string; items: { value: string; label: string }[] }[] = [];
    @observable accessor unsubscribe_ticks: (() => void) | null = null;
    @observable accessor pip = 2;
    private symbol_pips: Map<string, number> = new Map();

    constructor(root_store: RootStore) {
        makeObservable(this);
        this.root_store = root_store;
        this.stats_engine = new DigitStatsEngine();
        this.trade_engine = new DigitTradeEngine();

        this.initConnection();
    }

    @action
    initConnection = async () => {
        if (this.api) {
            this.api.disconnect();
        }

        this.api = generateDerivApiInstance();

        this.api.connection.addEventListener('open', () => {
            runInAction(() => {
                this.is_connected = true;
            });
            this.fetchMarkets();
            this.subscribeToTicks();
        });

        this.api.connection.addEventListener('close', () => {
            runInAction(() => {
                this.is_connected = false;
            });
        });

        // Handle authorization if token exists
        const token = V2GetActiveToken();
        if (token) {
            try {
                await this.api.authorize(token);
            } catch (e) {
                console.error('[DigitCrackerStore] Auth failed:', e);
            }
        }
    };

    @action
    fetchMarkets = async () => {
        try {
            const response = await this.api.send({ active_symbols: 'brief', product_type: 'basic' });
            if (response.active_symbols) {
                const filtered = response.active_symbols.filter((s: any) => s.market === 'synthetic_index');
                const grouped = [
                    {
                        group: 'Synthetic Indices',
                        items: filtered.map((s: any) => ({ value: s.symbol, label: s.display_name })),
                    },
                ];
                runInAction(() => {
                    this.markets = grouped;
                });
            }
        } catch (e) {
            console.error('[DigitCrackerStore] Failed to fetch markets:', e);
        }
    };

    @action
    updateEngineConfig = () => {
        this.stats_engine.setConfig({
            pip: this.pip,
            total_samples: this.total_ticks,
            over_under_threshold: this.over_under_threshold,
            match_diff_digit: this.match_diff_digit,
        });
        this.updateFromEngine();
    };

    @action
    setSymbol = (symbol: string) => {
        this.symbol = symbol;
        this.pip = this.symbol_pips.get(symbol) || 2;
        this.updateEngineConfig();
        this.subscribeToTicks();
    };

    @action
    subscribeToTicks = async () => {
        if (!this.api || !this.is_connected) return;

        if (this.unsubscribe_ticks) {
            this.unsubscribe_ticks();
        }

        this.is_subscribing = true;

        try {
            // Get history first
            const history = await this.api.send({
                ticks_history: this.symbol,
                count: 1000,
                end: 'latest',
                style: 'ticks',
            });

            if (history.history && history.history.prices) {
                const prices = history.history.prices;
                runInAction(() => {
                    const price_numbers = prices.map((p: string | number) => Number(p));
                    const last_digits = prices.map((p: number | string) => {
                        return this.stats_engine.extractLastDigit(p);
                    });

                    const last_price = price_numbers[price_numbers.length - 1];
                    this.current_price = last_price;
                    this.ticks = last_digits;

                    this.stats_engine.update(last_digits, price_numbers);
                    this.updateFromEngine();
                });
            }

            // Subscribe
            const sub = this.api.subscribe({
                ticks: this.symbol,
                subscribe: 1,
            });

            const subscription = sub.subscribe((data: any) => {
                if (data.tick) {
                    runInAction(() => {
                        const price = Number(data.tick.quote);
                        const new_digit = this.stats_engine.extractLastDigit(price);

                        if (!isNaN(new_digit)) {
                            const current_ticks = [...this.ticks, new_digit];
                            if (current_ticks.length > this.total_ticks) current_ticks.shift();

                            this.ticks = current_ticks;
                            this.last_digit = new_digit;
                            this.current_price = price;

                            this.stats_engine.updateWithHistory(this.ticks, price);
                            this.updateFromEngine();
                        }
                    });
                }
            });

            this.unsubscribe_ticks = () => {
                subscription.unsubscribe();
                this.api.send({ forget_all: 'ticks' });
            };

            runInAction(() => {
                this.is_subscribing = false;
            });
        } catch (e) {
            console.error('[DigitCrackerStore] Subscription failed:', e);
            runInAction(() => {
                this.is_subscribing = false;
            });
        }
    };

    @action
    updateFromEngine = () => {
        this.digit_stats = this.stats_engine.digit_stats;
        this.percentages = this.stats_engine.getPercentages();
        this.even_odd_history = this.stats_engine.even_odd_history;
        this.over_under_history = this.stats_engine.over_under_history;
    };

    @action
    dispose = () => {
        if (this.unsubscribe_ticks) {
            this.unsubscribe_ticks();
        }
        if (this.api) {
            this.api.disconnect();
        }
    };
}
