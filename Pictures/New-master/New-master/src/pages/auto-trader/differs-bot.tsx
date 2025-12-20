import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { Localize } from '@deriv-com/translations';

const DiffersBot = observer(() => {
    const { auto_trader } = useStore();
    const { digit_stats } = auto_trader;

    const highestDigit = [...digit_stats].sort((a, b) => b.count - a.count)[0];

    return (
        <div className='differs-bot'>
            <div className='differs-bot__title'>
                <Localize i18n_default_text='Differs Bot (Highest Digit Strategy)' />
            </div>

            <div className='differs-bot__info'>
                <div className='info-item'>
                    <div className='label'>Target Digit (Highest)</div>
                    <div className='value highlight'>{highestDigit?.digit}</div>
                </div>
                <div className='info-item'>
                    <div className='label'>Frequency</div>
                    <div className='value'>{highestDigit?.percentage.toFixed(1)}%</div>
                </div>
            </div>

            <div className='differs-bot__controls'>
                <button className='btn-start'>START DIFFERS BOT</button>
            </div>

            <div className='differs-bot__note'>
                <Localize i18n_default_text='Trades DIFFERS against the highest appearing digit to maximize probability.' />
            </div>
        </div>
    );
});

export default DiffersBot;
