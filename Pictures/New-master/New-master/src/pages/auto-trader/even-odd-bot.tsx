import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { Localize } from '@deriv-com/translations';

const EvenOddBot = observer(() => {
    const { auto_trader } = useStore();
    const { digit_stats } = auto_trader;

    const { evenCount, oddCount, total } = React.useMemo(() => {
        let even = 0;
        let odd = 0;
        let sum = 0;
        digit_stats.forEach(stat => {
            sum += stat.count;
            if (stat.digit % 2 === 0) even += stat.count;
            else odd += stat.count;
        });
        return { evenCount: even, oddCount: odd, total: sum };
    }, [digit_stats]);

    const evenProb = total > 0 ? (evenCount / total) * 100 : 0;
    const oddProb = total > 0 ? (oddCount / total) * 100 : 0;

    return (
        <div className='even-odd-bot'>
            <div className='even-odd-bot__title'>
                <Localize i18n_default_text='Even / Odd Bot (Dominant Side Strategy)' />
            </div>

            <div className='even-odd-bot__stats'>
                <div className={`side-card ${evenProb > oddProb ? 'dominant' : ''}`}>
                    <div className='label'>EVEN</div>
                    <div className='value'>{evenProb.toFixed(1)}%</div>
                </div>
                <div className={`side-card ${oddProb > evenProb ? 'dominant' : ''}`}>
                    <div className='label'>ODD</div>
                    <div className='value'>{oddProb.toFixed(1)}%</div>
                </div>
            </div>

            <div className='even-odd-bot__controls'>
                <button className='btn-start'>START EVEN/ODD BOT</button>
            </div>
        </div>
    );
});

export default EvenOddBot;
