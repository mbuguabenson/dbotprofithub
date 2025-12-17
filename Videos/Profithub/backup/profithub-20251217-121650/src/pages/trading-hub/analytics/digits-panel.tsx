import React, { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';

const DigitsPanel: React.FC = observer(() => {
    const { digit_analysis } = useStore();
    const {
        active_symbols,
        selected_symbol,
        tick_count,
        setSymbol,
        setTickCount,
        subscribe,
        unsubscribe,
        current_stats,
        digit_frequency,
        over_under_stats,
        streak_stats,
        reference_digit,
        setReferenceDigit,
        connection_status,
        is_loading,
    } = digit_analysis;

    useEffect(() => {
        subscribe();
        return () => {
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected_symbol, tick_count]);

    const freq = useMemo(() => digit_frequency, [digit_frequency]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>Market</label>
                    <select
                        value={selected_symbol}
                        onChange={e => setSymbol(e.target.value)}
                        style={{ padding: 8, background: 'var(--general-main-1)', color: 'var(--text-prominent)', border: '1px solid var(--border-normal)' }}
                    >
                        {active_symbols.map(s => (
                            <option key={s.symbol} value={s.symbol}>
                                {s.display_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>Ticks to analyse</label>
                    <select
                        value={tick_count}
                        onChange={e => setTickCount(Number(e.target.value))}
                        style={{ padding: 8, background: 'var(--general-main-1)', color: 'var(--text-prominent)', border: '1px solid var(--border-normal)' }}
                    >
                        {[25, 50, 100, 200, 500, 1000].map(c => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>Ref digit (over/under)</label>
                    <input
                        type='number'
                        min={0}
                        max={9}
                        value={reference_digit}
                        onChange={e => setReferenceDigit(Math.max(0, Math.min(9, Number(e.target.value))))}
                        style={{ width: 80, padding: 8, background: 'var(--general-main-1)', color: 'var(--text-prominent)', border: '1px solid var(--border-normal)' }}
                    />
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Status</div>
                    <div style={{ fontSize: 12 }}>
                        {is_loading ? 'Loading…' : connection_status === 'connected' ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, padding: 12, border: '1px solid var(--border-normal)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Last Price</div>
                    <div style={{ fontSize: 20 }}>{current_stats.price ?? '—'}</div>
                </div>
                <div style={{ flex: 1, padding: 12, border: '1px solid var(--border-normal)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Last Digit</div>
                    <div style={{ fontSize: 28, fontWeight: 'bold' }}>{current_stats.digit ?? '—'}</div>
                </div>
                <div style={{ flex: 1, padding: 12, border: '1px solid var(--border-normal)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Over/Under vs {reference_digit}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span>Over: {over_under_stats.over.toFixed(1)}%</span>
                        <span>Under: {over_under_stats.under.toFixed(1)}%</span>
                        <span>Match: {over_under_stats.matches.toFixed(1)}%</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>Streak: {streak_stats.type} × {streak_stats.count}</div>
                </div>
            </div>

            <div style={{ padding: 12, border: '1px solid var(--border-normal)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Digits Distribution (0–9)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8 }}>
                    {freq.map(({ digit, percentage, count }) => (
                        <div key={digit} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>{digit}</div>
                            <div
                                style={{
                                    height: 40,
                                    background: 'var(--brand-secondary)',
                                    opacity: 0.6,
                                    width: '100%',
                                    transform: `scaleY(${Math.max(0.05, percentage / 100)})`,
                                    transformOrigin: 'bottom',
                                    transition: 'transform 0.2s',
                                }}
                            />
                            <div style={{ fontSize: 12 }}>{count}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

export default DigitsPanel;