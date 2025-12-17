// Removed unused imports to satisfy lint-staged pre-commit rules

export const APP_IDS = {
    LOCALHOST: 113831, // Default for local dev
    TMP_STAGING: 113831,
    STAGING: 113831, // TODO: Update with real staging ID if different
    STAGING_BE: 113831,
    STAGING_ME: 113831,
    PRODUCTION: 113831, // Example production ID - needs verification
    PRODUCTION_BE: 113831,
    PRODUCTION_ME: 113831,
};

export const livechat_license_id = 12049137;
export const livechat_client_id = '66aa088aad5a414484c1fd1fa8a5ace7';

export const domain_app_ids = {
    'master.bot-standalone.pages.dev': APP_IDS.TMP_STAGING,
    'staging-dbot.deriv.com': APP_IDS.STAGING,
    'staging-dbot.deriv.be': APP_IDS.STAGING_BE,
    'staging-dbot.deriv.me': APP_IDS.STAGING_ME,
    'dbot.deriv.com': APP_IDS.PRODUCTION,
    'dbot.deriv.be': APP_IDS.PRODUCTION_BE,
    'dbot.deriv.me': APP_IDS.PRODUCTION_ME,
    'app.deriv.com': APP_IDS.PRODUCTION,
    localhost: APP_IDS.LOCALHOST,
};

export const getCurrentProductionDomain = () =>
    !/^staging\./.test(window.location.hostname) &&
    Object.keys(domain_app_ids).find(domain => window.location.hostname === domain);

export const isProduction = () => {
    const all_domains = Object.keys(domain_app_ids).map(domain => `(www\\.)?${domain.replace('.', '\\.')}`);
    return new RegExp(`^(${all_domains.join('|')})$`, 'i').test(window.location.hostname);
};

export const isTestLink = () => {
    return (
        window.location.origin?.includes('.binary.sx') ||
        window.location.origin?.includes('bot-65f.pages.dev') ||
        window.location.origin?.includes('.vercel.app') ||
        window.location.origin?.includes('.netlify.app') ||
        isLocal()
    );
};

export const isLocal = () => /localhost(:\d+)?$/i.test(window.location.hostname);

const getDefaultServerURL = () => {
    if (isTestLink()) {
        return 'ws.derivws.com';
    }

    let active_loginid_from_url;
    const search = window.location.search;
    if (search) {
        const params = new URLSearchParams(document.location.search.substring(1));
        active_loginid_from_url = params.get('acct1');
    }

    const loginid = window.localStorage.getItem('active_loginid') ?? active_loginid_from_url;
    const is_real = loginid && !/^(VRT|VRW)/.test(loginid);

    const server = is_real ? 'green' : 'blue';
    const server_url = `${server}.derivws.com`;

    return server_url;
};

export const getDefaultAppIdAndUrl = () => {
    const server_url = getDefaultServerURL();

    if (isTestLink()) {
        return { app_id: APP_IDS.LOCALHOST, server_url };
    }

    const current_domain = getCurrentProductionDomain() ?? '';
    const app_id = domain_app_ids[current_domain as keyof typeof domain_app_ids] ?? APP_IDS.PRODUCTION;

    return { app_id, server_url };
};

export const getAppId = (): number => {
    // Prefer environment variables if provided
    const env_app_id =
        (typeof process !== 'undefined' && (process.env?.DERIV_APP_ID as string)) ||
        // Rsbuild/Vite-style env fallback
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((import.meta as any)?.env?.VITE_DERIV_APP_ID as string);
    if (env_app_id && /^[0-9]+$/.test(env_app_id)) {
        return parseInt(env_app_id);
    }

    const config_app_id = localStorage.getItem('config.app_id');
    if (config_app_id) {
        return parseInt(config_app_id);
    }

    // Default universal fallback
    return 113831;
};

export const getSocketURL = () => {
    // Prefer environment variables if provided
    const env_server_url =
        (typeof process !== 'undefined' && process.env?.DERIV_SERVER_URL) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((import.meta as any)?.env?.VITE_DERIV_SERVER_URL as string);
    if (env_server_url && typeof env_server_url === 'string') {
        return env_server_url;
    }

    const local_storage_server_url = window.localStorage.getItem('config.server_url');
    if (local_storage_server_url) return local_storage_server_url;

    const server_url = getDefaultServerURL();

    return server_url;
};

export const checkAndSetEndpointFromUrl = () => {
    if (isTestLink()) {
        const url_params = new URLSearchParams(location.search.slice(1));

        if (url_params.has('qa_server') && url_params.has('app_id')) {
            const qa_server = url_params.get('qa_server') || '';
            const app_id = url_params.get('app_id') || '';

            url_params.delete('qa_server');
            url_params.delete('app_id');

            if (/^(^(www\.)?qa[0-9]{1,4}\.deriv.dev|(.*)\.derivws\.com)$/.test(qa_server) && /^[0-9]+$/.test(app_id)) {
                localStorage.setItem('config.app_id', app_id);
                localStorage.setItem('config.server_url', qa_server.replace(/"/g, ''));
            }

            const params = url_params.toString();
            const hash = location.hash;

            location.href = `${location.protocol}//${location.hostname}${location.pathname}${
                params ? `?${params}` : ''
            }${hash || ''}`;

            return true;
        }
    }

    return false;
};

export const getDebugServiceWorker = () => {
    const debug_service_worker_flag = window.localStorage.getItem('debug_service_worker');
    if (debug_service_worker_flag) return !!parseInt(debug_service_worker_flag);

    return false;
};

/**
 * Generates the redirect URI that strictly matches the current origin + pathname.
 * This is crucial for OAuth compliance.
 */
export const getRedirectUri = () => {
    const origin = window.location.origin;
    // Use a deterministic callback path to ensure OAuth returns to a handler route
    const callback_path = '/callback';
    return `${origin}${callback_path}`;
};

export const generateOAuthURL = () => {
    // Always use the production OAuth host and required app_id
    const original_url = new URL('https://oauth.deriv.com/oauth2/authorize');

    // Per request, do NOT include redirect_uri; rely on Deriv's front-channel
    // Ensure app_id is set to the provided value
    const app_id = 113831;
    original_url.searchParams.set('app_id', app_id.toString());

    return original_url.toString();
};
