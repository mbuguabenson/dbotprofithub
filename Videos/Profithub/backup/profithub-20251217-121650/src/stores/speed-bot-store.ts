import { action, makeObservable, observable, reaction, runInAction } from 'mobx';
import marketDataEngine from '@/services/market-data-engine';
import tradeExecutor from '@/services/trade-execution-engine';

export default class SpeedBotStore {
    root_store: unknown;

    // ... (rest of config) ...
    // Configuration
    symbol: string = 'R_100';
    contract_type: 'DIGITMATCH' | 'DIGITDIFF' | 'DIGITOVER' | 'DIGITUNDER' | 'EVEN' | 'ODD' = 'DIGITMATCH';
    stake: number = 10;
    duration: number = 1;
    martingale_multiplier: number = 2;
    martingale_max_steps: number = 5;
    tp: number = 50;
    sl: number = 50;

    // Live Data
    digit_counts: number[] = Array(10).fill(0);

    // Digits trading config
    prediction: number = 5; // default prediction/barrier for digits contracts (0-9)

    // Execution controls
    cooldown_ms: number = 1500;
    last_trade_time: number = 0;

    // Automation Strategy
    active_strategy_id: string | null = null;
    strategies: any = {
        even_odd_digits: {
            title: 'Even/Odd (Digits)',
            ticks: 5,
            stake: 10,
            martingale: 1,
        },
        even_odd_percent: {
            title: 'Even/Odd (%)',
            ticks: 5,
            stake: 10,
            martingale: 1,
        },
        over_under_digits: {
            title: 'Over/Under (Digits)',
            ticks: 3,
            stake: 10,
            martingale: 1,
        },
        over_under_percent: {
            title: 'Over/Under (%)',
            ticks: 3,
            stake: 10,
            martingale: 1,
        },
        rise_fall: {
            title: 'Rise/Fall',
            ticks: 5,
            stake: 10,
            martingale: 1,
        },
        matches_differs: {
            title: 'Matches/Differs',
            ticks: 5,
            stake: 10,
            martingale: 1,
        },
    };

    // Status
    is_running: boolean = false;
    status: 'IDLE' | 'SCANNING' | 'EXECUTING' | 'COOLDOWN' = 'IDLE';
    total_profit: number = 0;
    win_count: number = 0;
    loss_count: number = 0;

    constructor(root_store: any) {
        makeObservable(this, {
            symbol: observable,
            contract_type: observable,
            stake: observable,
            duration: observable,
            is_running: observable,
            status: observable,
            digit_counts: observable,
            prediction: observable,
            setSymbol: action,
            toggleBot: action,
            updateConfig: action,
            handleTick: action,
        });
        this.root_store = root_store;

        // Reactive Tick Loop
        reaction(
            () => marketDataEngine.latest_ticks.get(this.symbol),
            tick => {
                if (tick) {
                    this.handleTick();
                }
            }
        );
    }

    setSymbol(symbol: string) {
        this.symbol = symbol;
        marketDataEngine.subscribeToTick(symbol);
        // reset counts when switching symbols
        runInAction(() => {
            this.digit_counts = Array(10).fill(0);
        });
    }

    updateConfig(config: Partial<SpeedBotStore>) {
        Object.assign(this, config);
    }

    toggleBot() {
        this.is_running = !this.is_running;
        this.status = this.is_running ? 'SCANNING' : 'IDLE';
        // Ensure we are subscribed
        if (this.is_running) {
            marketDataEngine.subscribeToTick(this.symbol);
        }
    }

    async handleTick() {
        if (!this.is_running) return;

        // 1. Get Data from Engine
        const history = marketDataEngine.tick_history.get(this.symbol) || [];
        if (history.length < 5) return; // Need min buffer

        const last = history[history.length - 1];
        const lastDigit = last?.digit;
        if (typeof lastDigit === 'number' && lastDigit >= 0 && lastDigit <= 9) {
            // Update digit distribution counts
            runInAction(() => {
                // keep a soft cap by decaying counts if they grow too large
                const total = this.digit_counts.reduce((a, b) => a + b, 0);
                if (total > 1000) {
                    this.digit_counts = this.digit_counts.map(c => Math.floor(c * 0.9));
                }
                this.digit_counts[lastDigit] = (this.digit_counts[lastDigit] ?? 0) + 1;
            });
        }

        // 2. Strategy Logic (Example: Even/Odd %)
        // This is where the "Probability Engine" lives
        // In a real implementation, we would switch(active_strategy_id)

        // Simple trigger conditions for selected contract
        const now = Date.now();
        if (now - this.last_trade_time < this.cooldown_ms) return; // cooldown

        if (typeof lastDigit !== 'number') return;

        let should_trade = false;
        let trade_type = this.contract_type;

        switch (this.contract_type) {
            case 'EVEN':
                should_trade = lastDigit % 2 === 0;
                break;
            case 'ODD':
                should_trade = lastDigit % 2 !== 0;
                break;
            case 'DIGITOVER':
                should_trade = lastDigit > this.prediction;
                break;
            case 'DIGITUNDER':
                should_trade = lastDigit < this.prediction;
                break;
            case 'DIGITMATCH':
                should_trade = lastDigit === this.prediction;
                break;
            case 'DIGITDIFF':
                should_trade = lastDigit !== this.prediction;
                break;
            default:
                should_trade = false;
        }

        if (should_trade) {
            this.last_trade_time = now;
            await this.executeTrade(trade_type);
        }
    }

    async executeTrade(type: string) {
        this.status = 'EXECUTING';
        try {
            const result = await tradeExecutor.executeTrade({
                symbol: this.symbol,
                contract_type: type,
                stake: this.stake,
                duration: this.duration,
                duration_unit: 't',
                currency: 'USD',
                // digits-specific prediction (barrier)
                prediction: ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER'].includes(type)
                    ? this.prediction
                    : undefined,
            });

            if (result) {
                // Handle Win/Loss update (Mocked or Real)
                // In real app, we subscribe to 'proposal_open_contract'
                console.log('Trade Placed:', result);
            }
        } catch (e) {
            console.error(e);
        } finally {
            // enter short cooldown then resume scanning
            this.status = 'COOLDOWN';
            setTimeout(() => {
                runInAction(() => {
                    this.status = 'SCANNING';
                });
            }, this.cooldown_ms);
        }
    }
}
