export interface TFreeBot {
    id: string;
    name: string;
    description: string;
    category: 'Automatic' | 'Hybrid' | 'Normal' | 'Popular';
    xmlPath: string;
    isPremium: boolean;
    icon?: string;
    color?: string;
}

export const FREE_BOTS_DATA: TFreeBot[] = [
    // Automated Bots
    {
        id: 'auto-switch-ovun',
        name: 'OVER UNDER AUTO SWITCHER',
        description: 'Advanced logic to switch between Over and Under based on market trends.',
        category: 'Automatic',
        xmlPath: 'Automatic/OVER UNDER AUTO SWITCHER.xml',
        isPremium: true,
        color: '#ff9800',
    },
    {
        id: 'auto-ovun-x',
        name: 'OVER UNDER AUTOMATIC X',
        description: 'High-frequency Over/Under bot with optimized entry points.',
        category: 'Automatic',
        xmlPath: 'Automatic/OVER UNDER AUTOMATIC X .xml',
        isPremium: true,
        color: '#ff9800',
    },
    {
        id: 'profithub-premium-ai',
        name: 'PROFITHUB PREMIUM A.I.',
        description: 'AI-driven strategy for multiple market conditions.',
        category: 'Popular',
        xmlPath: 'Automatic/PROFITHUB PREMIUM A.I.xml',
        isPremium: true,
        color: '#a855f7',
    },
    {
        id: 'auto-rise-fall',
        name: 'PROFITHUB RISE FALL AUTO',
        description: 'Automatic Rise/Fall bot with trend following logic.',
        category: 'Automatic',
        xmlPath: 'Automatic/PROFITHUB RISE FALL AUTO.xml',
        isPremium: false,
        color: '#ff9800',
    },
    {
        id: 'auto-ov3-un8',
        name: 'PROFITHUB UNDER 8 OVER 3 AUTO',
        description: 'Safety-first strategy focused on Under 8 and Over 3.',
        category: 'Automatic',
        xmlPath: 'Automatic/PROFITHUB UNDER 8 OVER 3 AUTO.xml',
        isPremium: true,
        color: '#ff9800',
    },
    {
        id: 'auto-rise-fall-x',
        name: 'RISE AND FALL AUTOMATIC X',
        description: 'Next-gen Rise/Fall automatic bot for Volatility Indices.',
        category: 'Automatic',
        xmlPath: 'Automatic/RISE AND FALL AUTOMATIC X .xml',
        isPremium: true,
        color: '#ff9800',
    },

    // Hybrid Bots
    {
        id: 'hybrid-speedbot-entry',
        name: 'Speedbot with entry point',
        description: 'Hybrid bot combining manual entry with automatic management.',
        category: 'Hybrid',
        xmlPath: 'Hybrid Bots/Speedbot with entry point.xml',
        isPremium: true,
        color: '#4bb4b3',
    },
    {
        id: 'hybrid-differ-unstoppable',
        name: 'UNSTOPPABLE DIFFER BOT',
        description: 'Hybrid Differ bot designed for long-term consistency.',
        category: 'Hybrid',
        xmlPath: 'Hybrid Bots/🤑UNSTOPPABLE DIFFER BOT🤑.xml',
        isPremium: true,
        color: '#4bb4b3',
    },

    // Normal Bots
    {
        id: 'normal-profithub-pro',
        name: 'PROFIT HUB PRO',
        description: 'Standard pro strategy for general trading.',
        category: 'Normal',
        xmlPath: 'Normal Bots/PROFIT HUB PRO.xml',
        isPremium: false,
        color: '#3b82f6',
    },
    {
        id: 'normal-speedbot',
        name: 'Profithub Speedbot',
        description: 'Fast execution bot for quick market movements.',
        category: 'Normal',
        xmlPath: 'Normal Bots/Profithub Speedbot.xml',
        isPremium: true,
        color: '#3b82f6',
    },
    {
        id: 'normal-speedbot-updated',
        name: 'SPEED BOT updated',
        description: 'Updated version of the popular speed bot strategy.',
        category: 'Normal',
        xmlPath: 'Normal Bots/SPEED BOT updated.xml',
        isPremium: false,
        color: '#3b82f6',
    },
];
