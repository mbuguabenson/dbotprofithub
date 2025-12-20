import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import './copy-trader.scss';

const CopyTrading = observer(() => {
    const { copy_trader, client } = useStore();
    const {
        source_account,
        target_accounts,
        is_mirroring_internal,
        internal_multiplier,
        setSourceToken,
        setTargetToken,
        toggleInternalMirroring,
        setInternalMultiplier,
    } = copy_trader;

    return (
        <div className='copy-trader'>
            <div className='copy-trader__header'>
                <h1>
                    Copy Trading Platform <span className='premium-badge'>PREMIUM</span>
                </h1>
                <p>Mirror trades in real-time across multiple accounts with advanced risk control.</p>
            </div>

            <div className='copy-trader__internal-toggle'>
                <div className={`internal-mirror-card ${is_mirroring_internal ? 'active' : ''}`}>
                    <div className='mirror-info'>
                        <h3>Mirror Current Demo Account</h3>
                        <p>Automatically mirror trades from your active demo session to all target accounts.</p>
                    </div>
                    <div className='mirror-controls'>
                        {is_mirroring_internal && (
                            <div className='multiplier-group'>
                                <label>Stake Multiplier</label>
                                <input
                                    type='number'
                                    step='0.1'
                                    min='0.1'
                                    value={internal_multiplier}
                                    onChange={e => setInternalMultiplier(parseFloat(e.target.value) || 1)}
                                />
                                <span className='multiplier-hint'>x</span>
                            </div>
                        )}
                        <button
                            className={`toggle-btn ${is_mirroring_internal ? 'on' : 'off'}`}
                            onClick={toggleInternalMirroring}
                        >
                            {is_mirroring_internal ? 'Mirroring Enabled' : 'Enable Mirroring'}
                        </button>
                    </div>
                </div>
            </div>

            <div className='copy-trader__grid'>
                <div className={`account-card source-card ${is_mirroring_internal ? 'disabled' : ''}`}>
                    <div className='card-header'>
                        <div className='card-title'>
                            <span className='icon'>📡</span>
                            <h3>External Source</h3>
                        </div>
                        <span className={`status-badge ${source_account.status.toLowerCase()}`}>
                            {source_account.status}
                        </span>
                    </div>
                    <div className='card-body'>
                        {!is_mirroring_internal ? (
                            <>
                                <div className='input-group'>
                                    <label>API Token</label>
                                    <input
                                        type='password'
                                        placeholder='Enter source token...'
                                        value={source_account.token}
                                        onChange={e => setSourceToken(e.target.value)}
                                    />
                                </div>
                                <div className='account-details'>
                                    <div className='detail'>
                                        <span className='label'>Balance</span>
                                        <span className='value'>
                                            {source_account.balance} {source_account.currency}
                                        </span>
                                    </div>
                                    <div className='detail'>
                                        <span className='label'>Type</span>
                                        <span className='value'>{source_account.account_type}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className='internal-active-placeholder'>
                                <span className='pulsing-icon'>⬤</span>
                                <p>
                                    Mirroring from current session: <strong>{client.loginid}</strong>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className='account-card target-card'>
                    <div className='card-header'>
                        <div className='card-title'>
                            <span className='icon'>🎯</span>
                            <h3>Target Account</h3>
                        </div>
                        <span className={`status-badge ${target_accounts[0].status.toLowerCase()}`}>
                            {target_accounts[0].status}
                        </span>
                    </div>
                    <div className='card-body'>
                        <div className='input-group'>
                            <label>API Token</label>
                            <input
                                type='password'
                                placeholder='Enter target token...'
                                value={target_accounts[0].token}
                                onChange={e => setTargetToken(0, e.target.value)}
                            />
                        </div>
                        <div className='account-details'>
                            <div className='detail'>
                                <span className='label'>Balance</span>
                                <span className='value'>
                                    {target_accounts[0].balance} {target_accounts[0].currency}
                                </span>
                            </div>
                            <div className='detail'>
                                <span className='label'>Trades</span>
                                <span className='value'>{target_accounts[0].trades_count || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='copy-trader__monitoring'>
                <div className='monitoring-header'>
                    <h3>Trade Reflection Stream</h3>
                    <div className='live-indicator'>
                        <span className='dot'></span> LIVE
                    </div>
                </div>
                <div className='table-container'>
                    <table className='copy-table'>
                        <thead>
                            <tr>
                                <th>Market</th>
                                <th>Reference</th>
                                <th>Status</th>
                                <th>Stake</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={5} className='no-data'>
                                    <div className='empty-state'>
                                        <div className='empty-icon'>📊</div>
                                        <p>No active mirror streams detected.</p>
                                        <span>Start trading or enable internal mirroring to see results.</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});

export default CopyTrading;
