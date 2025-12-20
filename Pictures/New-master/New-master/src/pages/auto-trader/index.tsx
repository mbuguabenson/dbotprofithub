import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import AutoBots from './auto-bots';
import BotConfig from './bot-config';
import DiffersBot from './differs-bot';
import DigitStats from './digit-stats';
import EvenOddBot from './even-odd-bot';
import MarketSelector from './market-selector';
import OverUnderAnalysis from './over-under-analysis';
import './auto-trader.scss';

const AutoTrader = observer(() => {
    const { auto_trader } = useStore();

    useEffect(() => {
        auto_trader.fetchMarkets();
    }, [auto_trader]);

    return (
        <div className='auto-trader'>
            <MarketSelector />
            <DigitStats />
            <BotConfig />
            <div className='auto-trader__analysis-grid'>
                <OverUnderAnalysis />
                <AutoBots />
            </div>
            <div className='auto-trader__footer-bots'>
                <DiffersBot />
                <EvenOddBot />
            </div>
        </div>
    );
});

export default AutoTrader;
