import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { TStrategy } from '@/stores/smart-trading-store';
import { Localize } from '@deriv-com/translations';
import classNames from 'classnames';
import './smart-auto24-tab.scss';

const SmartAuto24Tab = observer(() => {
    const { smart_trading } = useStore();
    const {
        is_smart_auto24_running,
        smart_auto24_strategy,
        strategies,
        wins,
        losses,
        session_pl,
        trade_history,
        is_connected,
        enable_tp_sl,
        take_profit,
        stop_loss,
        max_consecutive_losses,
        is_max_loss_enabled,
        max_stake_limit,
        is_max_stake_enabled,
    } = smart_trading;

    const current_strategy = strategies[smart_auto24_strategy];
    const total_trades = wins + losses;
    const win_rate = total_trades > 0 ? (wins / total_trades) * 100 : 0;

    const handleToggleBot = () => {
        smart_trading.is_smart_auto24_running = !is_smart_auto24_running;
    };

    const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        smart_trading.smart_auto24_strategy = e.target.value;
    };

    const updateBaseStake = (val: string) => {
        const stake = parseFloat(val);
        if (!isNaN(stake)) current_strategy.stake = stake;
    };

    const updateMultiplier = (val: string) => {
        const mult = parseFloat(val);
        if (!isNaN(mult)) current_strategy.martingale = mult;
    };

    return (
        <div className='smart-auto24-tab'>
            {/* Bot Status Header */}
            <div className='card status-header'>
                <div className='status-info'>
                    <div className={classNames('indicator', { running: is_smart_auto24_running })} />
                    <div>
                        <div className='title'>
                            {is_smart_auto24_running ? (
                                <Localize i18n_default_text='BOT RUNNING' />
                            ) : (
                                <Localize i18n_default_text='BOT STOPPED' />
                            )}
                        </div>
                        <div className='subtitle'>
                            {is_smart_auto24_running ? (
                                <Localize i18n_default_text='Trading automatically 24/7' />
                            ) : (
                                <Localize i18n_default_text='Ready to start Smart Auto 24' />
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleToggleBot}
                    disabled={!is_connected}
                    className={classNames('btn-toggle', is_smart_auto24_running ? 'stop' : 'start')}
                >
                    {is_smart_auto24_running ? (
                        <Localize i18n_default_text='STOP' />
                    ) : (
                        <Localize i18n_default_text='START' />
                    )}
                </button>
            </div>

            {/* Strategy Configuration */}
            <div className='card config-grid'>
                <div className='input-group'>
                    <label>
                        <Localize i18n_default_text='Strategy' />
                    </label>
                    <select
                        value={smart_auto24_strategy}
                        onChange={handleStrategyChange}
                        disabled={is_smart_auto24_running}
                    >
                        {Object.values(strategies).map((s: TStrategy) => (
                            <option key={s.id} value={s.id}>
                                {s.name} (x{s.defaultMultiplier || s.martingale})
                            </option>
                        ))}
                    </select>
                </div>

                <div className='input-group'>
                    <label>
                        <Localize i18n_default_text='Base Stake' />
                    </label>
                    <input
                        type='number'
                        value={current_strategy.stake}
                        onChange={e => updateBaseStake(e.target.value)}
                        disabled={is_smart_auto24_running}
                        min='0.35'
                        step='0.01'
                    />
                </div>

                <div className='input-group'>
                    <label>
                        <Localize i18n_default_text='Martingale Multiplier' />
                    </label>
                    <input
                        type='number'
                        value={current_strategy.martingale}
                        onChange={e => updateMultiplier(e.target.value)}
                        disabled={is_smart_auto24_running}
                        min='1.1'
                        max='50.0'
                        step='0.1'
                    />
                </div>
            </div>

            {/* Risk Management */}
            <div className='card risk-card'>
                <div className='risk-header'>
                    <Localize i18n_default_text='Risk Management' />
                </div>
                <div className='config-grid'>
                    <div className='input-group'>
                        <label className='checkbox-label'>
                            <input
                                type='checkbox'
                                checked={enable_tp_sl}
                                onChange={e => (smart_trading.enable_tp_sl = e.target.checked)}
                                disabled={is_smart_auto24_running}
                            />
                            <Localize i18n_default_text='Take Profit ($)' />
                        </label>
                        <input
                            type='number'
                            value={take_profit}
                            onChange={e => (smart_trading.take_profit = parseFloat(e.target.value))}
                            disabled={is_smart_auto24_running || !enable_tp_sl}
                        />
                    </div>

                    <div className='input-group'>
                        <label className='checkbox-label'>
                            <input
                                type='checkbox'
                                checked={enable_tp_sl}
                                onChange={e => (smart_trading.enable_tp_sl = e.target.checked)}
                                disabled={is_smart_auto24_running}
                            />
                            <Localize i18n_default_text='Stop Loss ($)' />
                        </label>
                        <input
                            type='number'
                            value={stop_loss}
                            onChange={e => (smart_trading.stop_loss = parseFloat(e.target.value))}
                            disabled={is_smart_auto24_running || !enable_tp_sl}
                        />
                    </div>

                    <div className='input-group'>
                        <label className='checkbox-label'>
                            <input
                                type='checkbox'
                                checked={is_max_loss_enabled}
                                onChange={e => (smart_trading.is_max_loss_enabled = e.target.checked)}
                                disabled={is_smart_auto24_running}
                            />
                            <Localize i18n_default_text='Max Consecutive Losses' />
                        </label>
                        <input
                            type='number'
                            value={max_consecutive_losses}
                            onChange={e => (smart_trading.max_consecutive_losses = parseInt(e.target.value))}
                            disabled={is_smart_auto24_running || !is_max_loss_enabled}
                        />
                    </div>

                    <div className='input-group'>
                        <label className='checkbox-label'>
                            <input
                                type='checkbox'
                                checked={is_max_stake_enabled}
                                onChange={e => (smart_trading.is_max_stake_enabled = e.target.checked)}
                                disabled={is_smart_auto24_running}
                            />
                            <Localize i18n_default_text='Max Stake Limit' />
                        </label>
                        <input
                            type='number'
                            value={max_stake_limit}
                            onChange={e => (smart_trading.max_stake_limit = parseFloat(e.target.value))}
                            disabled={is_smart_auto24_running || !is_max_stake_enabled}
                        />
                    </div>
                </div>
            </div>

            {/* Performance Dashboard */}
            <div className='performance-dashboard'>
                <div className='card perf-card'>
                    <div className='label'>
                        <Localize i18n_default_text='Profit/Loss' />
                    </div>
                    <div className={classNames('value', session_pl >= 0 ? 'positive' : 'negative')}>
                        ${session_pl.toFixed(2)}
                    </div>
                </div>

                <div className='card perf-card'>
                    <div className='label'>
                        <Localize i18n_default_text='Total Trades' />
                    </div>
                    <div className='value'>{total_trades}</div>
                </div>

                <div className='card perf-card'>
                    <div className='label'>
                        <Localize i18n_default_text='Win Rate' />
                    </div>
                    <div className='value'>{win_rate.toFixed(1)}%</div>
                </div>

                <div className='card perf-card'>
                    <div className='label'>
                        <Localize i18n_default_text='Current Stake' />
                    </div>
                    <div className='value'>${current_strategy.current_stake.toFixed(2)}</div>
                    {current_strategy.current_stake > current_strategy.stake && (
                        <div className='extra'>
                            {(current_strategy.current_stake / current_strategy.stake).toFixed(1)}x base
                        </div>
                    )}
                </div>
            </div>

            {/* Digit Analysis View */}
            <div className='card analysis-card'>
                <div className='analysis-header'>
                    <Localize i18n_default_text='Even/Odd Analysis' />
                    <div className='current-streak'>
                        <Localize i18n_default_text='Current Streak: ' />
                        <span className={classNames('streak-val', smart_trading.current_streak >= 0 ? 'win' : 'loss')}>
                            {Math.abs(smart_trading.current_streak)}x {smart_trading.current_streak >= 0 ? 'win' : 'loss'}
                        </span>
                    </div>
                </div>
                
                <div className='percentage-bars'>
                    <div className='bar-wrapper even'>
                        <div className='bar-label'>Even</div>
                        <div className='bar-value'>{smart_trading.calculateProbabilities().even.toFixed(1)}%</div>
                        <div className='bar-fill' style={{ width: `${smart_trading.calculateProbabilities().even}%` }}></div>
                    </div>
                    <div className='bar-wrapper odd'>
                        <div className='bar-label'>Odd</div>
                        <div className='bar-value'>{smart_trading.calculateProbabilities().odd.toFixed(1)}%</div>
                        <div className='bar-fill' style={{ width: `${smart_trading.calculateProbabilities().odd}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Trade History Table */}
            <div className='card history-card'>
                <div className='history-header'>
                    <Localize i18n_default_text='Trade History' />
                </div>

                <div className='table-container'>
                    <table>
                        <thead>
                            <tr>
                                <th>
                                    <Localize i18n_default_text='Time' />
                                </th>
                                <th>
                                    <Localize i18n_default_text='Type' />
                                </th>
                                <th>
                                    <Localize i18n_default_text='Stake' />
                                </th>
                                <th>
                                    <Localize i18n_default_text='Result' />
                                </th>
                                <th>
                                    <Localize i18n_default_text='P/L' />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...trade_history]
                                .reverse()
                                .slice(0, 20)
                                .map((trade, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(trade.timestamp).toLocaleTimeString()}</td>
                                        <td>{trade.contractType}</td>
                                        <td>${trade.stake.toFixed(2)}</td>
                                        <td>
                                            <span
                                                className={classNames(
                                                    'badge',
                                                    trade.result === 'WON' ? 'win' : 'loss'
                                                )}
                                            >
                                                {trade.result}
                                            </span>
                                        </td>
                                        <td
                                            className={classNames(
                                                'profit',
                                                trade.profitLoss >= 0 ? 'positive' : 'negative'
                                            )}
                                        >
                                            {trade.profitLoss >= 0 ? '+' : ''}
                                            {trade.profitLoss.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});

export default SmartAuto24Tab;
