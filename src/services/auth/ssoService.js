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
    // Default (unscoped) callback. loginRedirect() builds a tenant-scoped callback
    // (/{orgSlug}/auth/callback) when an org slug is known, mirroring
    // ordering-frontend's per-org callback URL.
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: 'openid profile email offline_access'
});

// First path segments that are never tenant slugs (so they can't be mistaken for
// a tenant hint).
const SSO_RESERVED_SEGMENTS = new Set(['auth', 'landing', 'unauthorized', 'assets', 'images', 'media']);

/**
 * Resolve the org slug to scope the SSO flow to — i.e. the OPTIONAL `tenant` hint
 * sent to /authorize. We only scope when the caller passes an EXPLICIT, real org
 * slug (the user is on a tenant-scoped /{orgSlug}/auth/login, or a returning user
 * whose tenant we already know). For a generic /auth/login we return '' (NO hint):
 * auth-api then resolves the tenant from the user's primary org membership, which
 * avoids the "you are not a member of the requested tenant" error that a guessed
 * default (e.g. 'codevertex') caused. The token is always scoped correctly because
 * the JWT carries the real tenant_slug, which we read back in handleCallback().
 */
function resolveOrgSlugForSSO(explicit) {
    if (explicit && typeof explicit === 'string' && !SSO_RESERVED_SEGMENTS.has(explicit)) {
        return explicit;
    }
    return '';
}

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
/**
 * Begin the SSO login: redirect to auth-service /authorize with PKCE.
 *
 * @param {string} [returnTo] Path to return to after login (defaults to current path).
 * @param {string} [orgSlug]  Tenant org slug to scope the login to. When present
 *   it is sent as `tenant` on the authorize request (so auth-api mints a token
 *   for the right org) and used to build a tenant-scoped callback URI
 *   (/{orgSlug}/auth/callback) — mirroring ordering-frontend's redirectToSSO.
 */
export async function loginRedirect(returnTo, orgSlug) {
    const c = cfg();
    const slug = resolveOrgSlugForSSO(orgSlug);
    const verifier = randomString(64);
    const challenge = await sha256Challenge(verifier);
    const state = randomString(16);
    sessionStorage.setItem('pkce_verifier', verifier);
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('post_login_redirect', returnTo || window.location.pathname);
    if (slug) {
        // Persist so the callback page + axios know the tenant before /auth/me.
        try {
            localStorage.setItem('tenant_slug', slug);
        } catch (_) {
            /* no-op */
        }
    }

    // ALWAYS use the flat /auth/callback. It is the redirect_uri registered for the
    // erp-ui client on BOTH hosts (erp.codevertexitsolutions.com AND
    // erp.masterspace.co.ke — see auth-api cmd/seed buildRedirects), so the token
    // exchange's exact-match redirect_uri check passes for every tenant. A
    // per-tenant /{slug}/auth/callback would only match if that exact slug were
    // pre-registered, which broke login for tenants like 'codevertex-demo'. The
    // tenant is recovered from the JWT (tenant_slug) in handleCallback(), so the
    // callback does not need the slug in its path.
    const redirectUri = c.redirectUri;
    // Remember which redirect_uri we used — the token exchange must send the same one.
    sessionStorage.setItem('sso_redirect_uri', redirectUri);

    const url = new URL(`${c.authApi}/api/v1/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', c.clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', c.scope);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    // Tenant hint for auth-api (org-scoped token). auth-api ignores it if unknown.
    if (slug) {
        url.searchParams.set('tenant', slug);
        url.searchParams.set('org', slug);
    }
    window.location.href = url.toString();
}

/** Handle the /auth/callback: verify state, exchange code for tokens. */
export async function handleCallback() {
    const c = cfg();
    const params = new URLSearchParams(window.location.search);

    // The auth-service may redirect back with an OAuth error instead of a code
    // (e.g. error=access_denied "you are not a member of the requested tenant",
    // or the user cancelled). Surface the human-readable description rather than
    // the misleading "Missing authorization code".
    const oauthError = params.get('error');
    if (oauthError) {
        const desc = params.get('error_description') || '';
        const message = (desc || oauthError).replace(/\+/g, ' ');
        const err = new Error(message);
        err.code = oauthError;
        throw err;
    }

    const code = params.get('code');
    const state = params.get('state');
    if (!code) throw new Error('Missing authorization code');
    if (state !== sessionStorage.getItem('oauth_state')) throw new Error('Invalid state (possible CSRF)');

    const verifier = sessionStorage.getItem('pkce_verifier');
    // Use the SAME redirect_uri that was sent to /authorize (tenant-scoped when an
    // org slug was known) — the token endpoint requires an exact match.
    const redirectUri = sessionStorage.getItem('sso_redirect_uri') || c.redirectUri;
    // The OIDC /token endpoint parses the body as application/x-www-form-urlencoded
    // (r.ParseForm + r.FormValue). Sending JSON makes every field empty → 400
    // "missing parameters". Use a urlencoded form body.
    const form = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        code_verifier: verifier || '',
        client_id: c.clientId,
        redirect_uri: redirectUri
    });
    const res = await fetch(`${c.authApi}/api/v1/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: form.toString()
    });
    if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
    const data = await res.json();
    setTokens(data);

    // Persist tenant context from the JWT for downstream API headers.
    const claims = parseJwt(data.access_token || '');
    if (claims.tenant_id) localStorage.setItem('tenant_id', claims.tenant_id);
    // Prefer the JWT tenant_slug; fall back to the org slug already captured from
    // the /{orgSlug}/auth/callback path (set by loginRedirect / the router guard).
    if (claims.tenant_slug) {
        localStorage.setItem('tenant_slug', claims.tenant_slug);
    } else {
        const pathSlug = resolveOrgSlugForSSO();
        if (pathSlug) localStorage.setItem('tenant_slug', pathSlug);
    }
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
    sessionStorage.removeItem('sso_redirect_uri');
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
