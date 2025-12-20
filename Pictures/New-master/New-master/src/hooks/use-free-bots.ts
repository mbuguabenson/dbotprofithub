import { useState, useCallback } from 'react';
import { useStore } from '@/hooks/useStore';
import { FREE_BOTS_DATA, TFreeBot } from '../pages/free-bots/free-bots-data';

export const useFreeBots = () => {
    const { load_modal, dashboard } = useStore();
    const [selectedCategory, setSelectedCategory] = useState<string>('Popular');
    const [isLoading, setIsLoading] = useState(false);

    const categories = ['Popular', 'Automatic', 'Hybrid', 'Normal'];

    const filteredBots = FREE_BOTS_DATA.filter(bot => bot.category === selectedCategory);

    const loadBotToBuilder = useCallback(
        async (bot: TFreeBot) => {
            setIsLoading(true);
            try {
                // In a real scenario, we would fetch the XML from the server
                // Since these are local files in the root, we'll try to fetch them via relative path
                const response = await fetch(`/${bot.xmlPath}`);
                if (!response.ok) throw new Error('Failed to fetch bot XML');
                const xmlString = await response.text();

                const strategy = {
                    id: bot.id,
                    name: bot.name,
                    xml: xmlString,
                    save_type: 'local', // Mapping to Deriv's save types
                };

                // Use the existing load_modal store to inject into Blockly
                await load_modal.loadStrategyToBuilder(strategy);

                // Navigate to Bot Builder
                dashboard.setActiveTab(1);
                window.location.hash = 'bot_builder';
            } catch (error) {
                console.error('Error loading bot:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [load_modal, dashboard]
    );

    return {
        selectedCategory,
        setSelectedCategory,
        categories,
        filteredBots,
        loadBotToBuilder,
        isLoading,
    };
};
