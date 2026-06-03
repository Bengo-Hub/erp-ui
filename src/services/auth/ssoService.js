/**
 * SSO (OIDC Authorization Code + PKCE) client for the ERP UI.
 *
 * Delegates login to the platform auth-service per shared-docs/sso-integration-guide.md
 * and login-flow-contract.md. Gated by VITE_SSO_ENABLED so the legacy /auth/login keeps
 * working until cutover.
 *
 * Required env:
 *   VITE_SSO_ENABLED=true
 *   VITE_SSO_URL        e.g. https://sso.codevertexitsolutions.com   (preferred)
 *   VITE_AUTH_API_URL   legacy alias for VITE_SSO_URL (still honoured)
 *   VITE_SSO_CLIENT_ID  e.g. erp-ui
 */

const cfg = () => ({
    enabled: String(import.meta.env.VITE_SSO_ENABLED || 'false').toLowerCase() === 'true',
    // VITE_SSO_URL is the documented var; VITE_AUTH_API_URL is the legacy alias.
    authApi: (import.meta.env.VITE_SSO_URL || import.meta.env.VITE_AUTH_API_URL || '').replace(/\/$/, ''),
    clientId: import.meta.env.VITE_SSO_CLIENT_ID || 'erp-ui',
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: 'openid profile email offline_access'
});

export const isSSOEnabled = () => cfg().enabled;

/** Base URL of the SSO/auth-service (no trailing slash). */
export const ssoBaseUrl = () => cfg().authApi;

// --- PKCE helpers ---------------------------------------------------------
function randomString(len = 64) {
    const arr = new Uint8Array(len);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, (b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function base64UrlEncode(buffer) {
    let str = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Challenge(verifier) {
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return base64UrlEncode(digest);
}

// --- token storage --------------------------------------------------------
const TOK = { access: 'access_token', refresh: 'refresh_token', id: 'id_token' };

// Canonical outlet key for the ERP UI (matches the {service}-selected-outlet-id
// convention in shared-docs/sso-integration-guide.md → Outlet/Branch Context).
export const OUTLET_STORAGE_KEY = 'erp-selected-outlet-id';

export function getAccessToken() {
    return localStorage.getItem(TOK.access) || sessionStorage.getItem(TOK.access);
}
export function getRefreshToken() {
    return localStorage.getItem(TOK.refresh);
}

// --- outlet context -------------------------------------------------------
// The axios interceptor reads the selected outlet from localStorage and sends
// it as X-Outlet-ID on every request. These helpers are the canonical setter/
// getter so components don't poke localStorage directly.
export function getOutletId() {
    return localStorage.getItem(OUTLET_STORAGE_KEY) || localStorage.getItem('outlet_id') || null;
}

/** Set (or clear) the active outlet. Pass null/'' for "All Outlets". */
export function setOutletId(outletId) {
    if (outletId) {
        localStorage.setItem(OUTLET_STORAGE_KEY, outletId);
        // Keep the legacy key in sync for any code still reading 'outlet_id'.
        localStorage.setItem('outlet_id', outletId);
    } else {
        localStorage.removeItem(OUTLET_STORAGE_KEY);
        localStorage.removeItem('outlet_id');
    }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('outlet:changed', { detail: { outletId: outletId || null } }));
    }
}
function setTokens({ access_token, refresh_token, id_token }) {
    if (access_token) localStorage.setItem(TOK.access, access_token);
    if (refresh_token) localStorage.setItem(TOK.refresh, refresh_token);
    if (id_token) localStorage.setItem(TOK.id, id_token);
}
function clearTokens() {
    Object.values(TOK).forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
    });
}

export function parseJwt(token) {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(escape(atob(payload))));
    } catch {
        return {};
    }
}

// --- flows ----------------------------------------------------------------
/** Begin the SSO login: redirect to auth-service /authorize with PKCE. */
export async function loginRedirect(returnTo) {
    const c = cfg();
    const verifier = randomString(64);
    const challenge = await sha256Challenge(verifier);
    const state = randomString(16);
    sessionStorage.setItem('pkce_verifier', verifier);
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('post_login_redirect', returnTo || window.location.pathname);

    const url = new URL(`${c.authApi}/api/v1/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', c.clientId);
    url.searchParams.set('redirect_uri', c.redirectUri);
    url.searchParams.set('scope', c.scope);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    window.location.href = url.toString();
}

/** Handle the /auth/callback: verify state, exchange code for tokens. */
export async function handleCallback() {
    const c = cfg();
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code) throw new Error('Missing authorization code');
    if (state !== sessionStorage.getItem('oauth_state')) throw new Error('Invalid state (possible CSRF)');

    const verifier = sessionStorage.getItem('pkce_verifier');
    const res = await fetch(`${c.authApi}/api/v1/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            code_verifier: verifier,
            client_id: c.clientId,
            redirect_uri: c.redirectUri
        })
    });
    if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
    const data = await res.json();
    setTokens(data);

    // Persist tenant context from the JWT for downstream API headers.
    const claims = parseJwt(data.access_token || '');
    if (claims.tenant_id) localStorage.setItem('tenant_id', claims.tenant_id);
    if (claims.tenant_slug) localStorage.setItem('tenant_slug', claims.tenant_slug);
    // is_hq_user controls whether the outlet selector is shown (HQ users pick an
    // outlet per-request; single-outlet staff are pinned to their JWT outlet).
    localStorage.setItem('is_hq_user', String(claims.is_hq_user === true));
    // Outlet preselection per sso-integration-guide step 11: single-outlet staff
    // (outlet_id present AND is_hq_user=false) are auto-pinned to their outlet.
    if (claims.outlet_id && claims.is_hq_user !== true) {
        setOutletId(claims.outlet_id);
    }
    sessionStorage.setItem('isAuthenticated', 'true');
    // Grace period: skip the 401 logout for ~15s after a fresh sign-in so the
    // JIT /auth/me sync delay does not bounce the user back to SSO.
    localStorage.setItem('lastAuthenticatedAt', String(Date.now()));

    sessionStorage.removeItem('pkce_verifier');
    sessionStorage.removeItem('oauth_state');
    return { tokens: data, claims, redirect: sessionStorage.getItem('post_login_redirect') || '/' };
}

/** Refresh the access token. Returns the new access token or throws. */
export async function refreshAccessToken() {
    const c = cfg();
    const refresh_token = getRefreshToken();
    if (!refresh_token) throw new Error('No refresh token');
    const res = await fetch(`${c.authApi}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token, client_id: c.clientId })
    });
    if (!res.ok) throw new Error(`Refresh failed (${res.status})`);
    const data = await res.json();
    setTokens(data);
    return data.access_token;
}

export function ssoLogout() {
    clearTokens();
    sessionStorage.removeItem('isAuthenticated');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('tenant_slug');
    localStorage.removeItem('outlet_id');
    localStorage.removeItem(OUTLET_STORAGE_KEY);
    localStorage.removeItem('is_hq_user');
    localStorage.removeItem('is_platform_owner');
    localStorage.removeItem('platform-selected-tenant-id');
    localStorage.removeItem('platform-selected-tenant-slug');
    localStorage.removeItem('lastAuthenticatedAt');
}

/**
 * Full SSO logout: clear local state then redirect to the auth-service logout
 * endpoint so the shared session cookie is cleared too. (sso-integration-guide
 * → Logout flow.)
 */
export function ssoLogoutRedirect() {
    const c = cfg();
    ssoLogout();
    if (c.authApi) {
        const url = `${c.authApi}/api/v1/auth/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
        window.location.href = url;
    } else {
        window.location.href = '/auth/login';
    }
}
