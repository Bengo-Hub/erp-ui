import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { apiClient } from '@/lib/api/client';
import { authAdminClient } from '@/lib/api/auth-admin-client';
import { useOutletFilterStore } from '@/store/outlet-filter';
import { buildAuthorizeUrl, buildLogoutUrl, exchangeCodeForTokens, revokeServerSession } from '@/lib/auth/api';
import { generateCodeChallenge, generateCodeVerifier, generateState, getVerifier, removeVerifier, storeState, storeVerifier } from '@/lib/auth/pkce';
import type { SubscriptionInfo } from '@/lib/auth/subscription';
import type { AuthStatus, Session, UserProfile } from '@/lib/auth/types';
import { cookieMode } from '@/lib/auth/session-mode';
import { parseJwt } from '@/lib/utils';
import { scrubStoredSession } from '@bengo-hub/shared-ui-lib/auth';

const AUTH_STORAGE_KEY = 'erp-auth-storage';

/** True from the first logout call until the browser leaves for the SSO logout page. */
let loggingOut = false;

/** Whether a logout is under way; SSO redirects must not start while it is. */
export function isLoggingOut(): boolean {
    return loggingOut;
}

// Cookie session (fleet plan G11): tokens an earlier build stored are dropped before the store
// loads; from here on only the profile is persisted.
if (cookieMode()) scrubStoredSession(AUTH_STORAGE_KEY);

interface AuthState {
    status: AuthStatus;
    user: UserProfile | null;
    session: Session | null;
    error: string | null;
    lastAuthenticatedAt: number | null;

    subscriptionInfo: SubscriptionInfo | null | undefined;
    setSubscriptionInfo: (info: SubscriptionInfo | null) => void;

    /** Push the current user's tenant/platform context into the shared ApiClient. */
    syncApiClient: (user: UserProfile) => void;
    /** Synchronous with stored tokens; the cookie session waits for its first token. */
    initialize: () => void | Promise<void>;
    redirectToSSO: (orgSlug: string, returnTo?: string) => Promise<void>;
    handleSSOCallback: (orgSlug: string, code: string, callbackUrl: string) => Promise<void>;
    setUser: (user: UserProfile) => void;
    logout: () => Promise<void>;
}

/** Build a UserProfile from the access-token JWT claims (pre-/auth/me bootstrap). */
function profileFromClaims(claims: Record<string, unknown>): UserProfile {
    const slug = (claims.tenant_slug as string) ?? '';
    return {
        id: (claims.sub as string) ?? '',
        email: (claims.email as string) ?? '',
        fullName: (claims.name as string) ?? (claims.email as string) ?? '',
        roles: Array.isArray(claims.roles) ? (claims.roles as string[]) : [],
        permissions: Array.isArray(claims.permissions) ? (claims.permissions as string[]) : [],
        organizationId: (claims.tenant_id as string) ?? '',
        tenantId: (claims.tenant_id as string) ?? '',
        tenantSlug: slug,
        outletId: (claims.outlet_id as string) ?? null,
        isHqUser: claims.is_hq_user === true,
        isPlatformOwner: claims.is_platform_owner === true,
        isSuperUser: Array.isArray(claims.roles) && (claims.roles as string[]).includes('superuser'),
        subExempt: claims.sub_exempt === true,
        billingMode: (claims.billing_mode as string) ?? ''
    };
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            status: 'idle',
            user: null,
            session: null,
            error: null,
            lastAuthenticatedAt: null,
            subscriptionInfo: undefined,

            setSubscriptionInfo: (info) => set({ subscriptionInfo: info }),

            syncApiClient: (user) => {
                const isPlatform = !!user.isPlatformOwner;
                apiClient.setPlatformOwner(isPlatform);
                apiClient.setTenantContext(user.tenantId || null, user.tenantSlug || null);
                apiClient.setOutletID(user.isHqUser ? null : (user.outletId ?? null));

                // auth-api client (user/role/member admin lives in auth-service, not erp-api).
                authAdminClient.setTenantContext(user.tenantId || null, user.tenantSlug || null);
            },

            initialize: () => {
                if (cookieMode()) return initializeFromCookie();
                const { session, user } = get();
                if (!session) {
                    set({ status: 'idle' });
                    return;
                }
                apiClient.setAccessToken(session.accessToken);
                authAdminClient.setAccessToken(session.accessToken);
                if (user) get().syncApiClient(user);

                if (session.expiresAt) {
                    const expiresAt = new Date(session.expiresAt).getTime();
                    if (Date.now() < expiresAt - 60_000) {
                        set({ status: 'authenticated', lastAuthenticatedAt: get().lastAuthenticatedAt ?? Date.now() });
                        return;
                    }
                }
                // Token near/at expiry — let the refresh interceptor handle it; stay optimistic.
                set({ status: 'authenticated' });
            },

            redirectToSSO: async (orgSlug, returnTo) => {
                // A logout is navigating to the SSO logout page; starting a sign-in now would
                // cancel it and sign the user straight back in.
                if (loggingOut) return;
                set({ status: 'loading', error: null });
                try {
                    const verifier = generateCodeVerifier();
                    const challenge = await generateCodeChallenge(verifier);
                    const state = generateState();
                    storeVerifier(verifier);
                    storeState(state);
                    if (returnTo) sessionStorage.setItem('sso_return_to', returnTo);

                    // Flat /auth/callback is registered for the erp-ui client on every host
                    // (exact redirect_uri match). The tenant is recovered from the JWT.
                    const callbackUrl = `${window.location.origin}/auth/callback`;
                    sessionStorage.setItem('sso_redirect_uri', callbackUrl);

                    window.location.href = buildAuthorizeUrl({
                        codeChallenge: challenge,
                        state,
                        redirectUri: callbackUrl,
                        tenant: orgSlug
                    });
                } catch {
                    set({ status: 'error', error: 'Failed to start sign-in' });
                }
            },

            handleSSOCallback: async (orgSlug, code, callbackUrl) => {
                set({ status: 'syncing', error: null });
                const verifier = getVerifier();
                if (!verifier) {
                    set({ status: 'error', error: 'Session expired. Please sign in again.' });
                    return;
                }
                try {
                    const redirectUri = sessionStorage.getItem('sso_redirect_uri') || callbackUrl;
                    const tokens = await exchangeCodeForTokens({ code, codeVerifier: verifier, redirectUri });
                    removeVerifier();
                    sessionStorage.removeItem('sso_redirect_uri');

                    if (cookieMode()) {
                        // The refresh token goes into auth-api's HttpOnly cookie and is dropped here; the
                        // store holds only the in-memory access token the cookie session hands back.
                        const { getCookieSession } = await import('@/lib/auth/cookie-session');
                        // A new sign-in replaces whoever was stored, so it is not taken for a user switch.
                        set({ user: null, session: null });
                        const started = await getCookieSession().start(tokens.refresh_token || '');
                        const mirrored = useAuthStore.getState().session;
                        if (!('token' in started) || !mirrored) {
                            set({ status: 'error', error: 'Sign-in failed' });
                            return;
                        }
                        const user = profileFromClaims(parseJwt(mirrored.accessToken));
                        get().syncApiClient(user);
                        set({ user, status: 'authenticated', lastAuthenticatedAt: Date.now() });
                        return;
                    }

                    const session: Session = {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token || '',
                        idToken: tokens.id_token,
                        expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()
                    };
                    apiClient.setAccessToken(session.accessToken);
                    authAdminClient.setAccessToken(session.accessToken);

                    const claims = parseJwt(tokens.access_token || '');
                    const user = profileFromClaims(claims);
                    get().syncApiClient(user);
                    set({ session, user, status: 'authenticated', lastAuthenticatedAt: Date.now() });
                } catch (e) {
                    set({ status: 'error', error: e instanceof Error ? e.message : 'Sign-in failed' });
                }
            },

            setUser: (user) => {
                get().syncApiClient(user);
                set({ user });
            },

            logout: async () => {
                // One logout at a time: 401s from in-flight queries call logout again.
                if (loggingOut) return;
                loggingOut = true;
                // Capture the working org BEFORE clearing any state/storage, so re-login
                // targets the SAME organisation rather than a default one: URL path first
                // (tenant pages are /{orgSlug}/...; reserved segments are not tenants),
                // then the signed-in profile. Never a hardcoded tenant.
                const RESERVED_SEGMENTS = new Set(['auth', 'landing', 'unauthorized', 'healthz']);
                let slug = '';
                if (typeof window !== 'undefined') {
                    const first = window.location.pathname.split('/').filter(Boolean)[0] ?? '';
                    if (first && !RESERVED_SEGMENTS.has(first)) slug = first;
                }
                slug = slug || get().user?.tenantSlug || '';

                if (cookieMode()) {
                    // Revokes the session, clears the sso cookie and signs the other tabs out.
                    const { getCookieSession } = await import('@/lib/auth/cookie-session');
                    await getCookieSession().end();
                } else {
                    const token = get().session?.accessToken;
                    // Revoke the backend session (Redis session_token keys + DB sessions)
                    // BEFORE clearing local state, so we still have the access token.
                    await revokeServerSession(token);
                }

                // Stay in 'loading', never 'idle': an idle status makes the AuthProvider send the
                // browser to SSO authorize, which cancelled the logout navigation below while the
                // SSO login session was still alive, so the user was signed straight back in.
                set({
                    status: 'loading',
                    user: null,
                    session: null,
                    subscriptionInfo: undefined,
                    lastAuthenticatedAt: null
                });
                apiClient.setAccessToken(null);
                authAdminClient.setAccessToken(null);
                apiClient.setOutletID(null);
                try {
                    useOutletFilterStore.getState().reset();
                } catch {
                    /* no-op */
                }
                if (typeof window !== 'undefined') {
                    try {
                        localStorage.removeItem(AUTH_STORAGE_KEY);
                    } catch {
                        /* no-op */
                    }
                    try {
                        localStorage.removeItem('erp-outlet-filter');
                    } catch {
                        /* no-op */
                    }
                    try {
                        sessionStorage.clear();
                    } catch {
                        /* no-op */
                    }
                    // Land on the tenant app root: arriving there unauthenticated re-triggers
                    // SSO with tenant=<slug>, so the login screen shows the RIGHT organisation.
                    window.location.href = slug ? buildLogoutUrl(`${window.location.origin}/${slug}`) : buildLogoutUrl(`https://accounts.codevertexafrica.com/login?return_to=${encodeURIComponent(window.location.origin)}`);
                }
            }
        }),
        {
            name: AUTH_STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
            // The cookie session persists the profile only; the access token stays in memory.
            partialize: (state) => (cookieMode() ? { user: state.user, lastAuthenticatedAt: state.lastAuthenticatedAt } : { session: state.session, user: state.user, lastAuthenticatedAt: state.lastAuthenticatedAt })
        }
    )
);

/** No token is stored: a known profile gets its first token through the sso cookie. */
async function initializeFromCookie(): Promise<void> {
    const known = useAuthStore.getState().user;
    if (!known) {
        useAuthStore.setState({ status: 'idle' });
        return;
    }
    useAuthStore.setState({ status: 'loading' });
    const { getCookieSession } = await import('@/lib/auth/cookie-session');
    const token = await getCookieSession().getAccessToken();
    if (!token) {
        useAuthStore.setState({ status: 'idle', session: null, user: null });
        return;
    }
    useAuthStore.getState().syncApiClient(known);
    useAuthStore.setState({
        status: 'authenticated',
        lastAuthenticatedAt: useAuthStore.getState().lastAuthenticatedAt ?? Date.now()
    });
}
