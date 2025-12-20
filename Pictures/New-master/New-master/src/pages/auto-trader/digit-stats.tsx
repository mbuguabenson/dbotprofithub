import { useEffect, useMemo } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { Localize } from '@deriv-com/translations';

const DigitStats = observer(() => {
    const { auto_trader, app } = useStore();
    const { digit_stats, sample_size, setSampleSize, updateDigitStats, symbol, last_digit } = auto_trader;
    const { api_helpers_store } = app;

    useEffect(() => {
        if (!api_helpers_store?.ticks_service || !symbol) return;

        let is_mounted = true;
        const { ticks_service } = api_helpers_store;
        let listenerKey: string | null = null;

        const monitorTicks = async () => {
            try {
                const callback = (ticks: { quote: string | number }[]) => {
                    if (is_mounted && ticks && ticks.length > 0) {
                        const latest = ticks[ticks.length - 1];
                        const last_digits = ticks.slice(-sample_size).map(t => {
                            const quote_str = String(t.quote);
                            const digit = parseInt(quote_str[quote_str.length - 1]);
                            return isNaN(digit) ? 0 : digit;
                        });
                        updateDigitStats(last_digits, latest.quote);
                    }
                };

                const key = await ticks_service.monitor({ symbol, callback });
                if (is_mounted) {
                    listenerKey = key;
                } else {
                    ticks_service.stopMonitor({ symbol, key });
                }
            } catch (error) {
                console.error(`Error monitoring ticks for ${symbol}:`, error);
            }
        };

        monitorTicks();

        return () => {
            is_mounted = false;
            if (listenerKey) {
                ticks_service.stopMonitor({ symbol, key: listenerKey });
            }
        };
    }, [sample_size, updateDigitStats, api_helpers_store?.ticks_service, symbol]);

    if (!api_helpers_store) return null;

    const maxCount = useMemo(() => Math.max(...digit_stats.map(s => s.count)), [digit_stats]);
    const minCount = useMemo(() => Math.min(...digit_stats.map(s => s.count)), [digit_stats]);

    return (
        <div className='digit-stats'>
            <div className='digit-stats__title'>
                <Localize i18n_default_text='Digit Distribution' />
                <div className='digit-stats__controls'>
                    <div className='sample-selector'>
                        {[25, 50, 100, 500, 1000, 5000].map(val => (
                            <div
                                key={val}
                                className={classNames('sample-selector__item', {
                                    'sample-selector__item--active': sample_size === val,
                                })}
                                onClick={() => setSampleSize(val)}
                            >
                                {val}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className='digit-stats__grid'>
                {digit_stats.map(stat => {
                    const is_active = last_digit === stat.digit;
                    const radius = 42;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (stat.percentage / 100) * circumference;

                    return (
                        <div
                            key={stat.digit}
                            className={classNames('digit-ring', {
                                'digit-ring--active': is_active,
                                highest: stat.count === maxCount && maxCount > minCount,
                                lowest: stat.count === minCount && maxCount > minCount,
                            })}
                        >
                            <svg width='100' height='100'>
                                <circle className='bg' cx='50' cy='50' r={radius} />
                                <circle
                                    className='progress'
                                    cx='50'
                                    cy='50'
                                    r={radius}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                />
                            </svg>
                            <div className='digit-ring__info'>
                                <div className='digit-ring__label'>{stat.digit}</div>
                                <div className='digit-ring__percentage'>{stat.percentage.toFixed(1)}%</div>
                            </div>
                            {is_active && <div className='active-cursor' />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default DigitStats;
