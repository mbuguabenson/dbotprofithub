import React from 'react';
import ChunkLoader from '@/components/loader/chunk-loader';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { AuthManager } from '@/utils/AuthManager';
import { localize } from '@deriv-com/translations';
import App from './App';

export const AuthWrapper = () => {
    const [isAuthComplete, setIsAuthComplete] = React.useState(false);
    const { isOnline } = useOfflineDetection();

    React.useEffect(() => {
        const initializeAuth = async () => {
            // Check for tokens on any route (front-channel may land on "/")
            const searchParams = new URLSearchParams(window.location.search);
            const hasTokens =
                searchParams.has('token1') || searchParams.has('acct1') || searchParams.has('token') ||
                window.location.search.includes('token');

            if (hasTokens) {
                const processed = await AuthManager.processCallback();
                if (processed) {
                    console.log('[AuthWrapper] Auth processed successfully');
                }
            }

            // Fallback for offline or already logged in states
            setIsAuthComplete(true);
        };

        initializeAuth();
    }, [isOnline]);

    if (!isAuthComplete && window.location.search.includes('token')) {
        return <ChunkLoader message={localize('Processing authentication...')} />;
    }

    return <App />;
};
