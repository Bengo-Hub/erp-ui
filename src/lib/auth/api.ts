/**
 * OIDC (Authorization Code + PKCE) client for the ERP UI, delegating to auth-api.
 *
 * Ports the working logic from the Vue `ssoService.js`:
 *  - /authorize with PKCE + tenant hint
 *  - /token exchange sent as application/x-www-form-urlencoded (the OIDC endpoint
 *    parses the body with ParseForm — JSON bodies become empty fields → 400)
 *  - /auth/refresh, /auth/logout
 */

const SSO_BASE_URL = (
  process.env.NEXT_PUBLIC_SSO_URL ||
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://sso.codevertexitsolutions.com"
).replace(/\/$/, "");

const SSO_CLIENT_ID = process.env.NEXT_PUBLIC_SSO_CLIENT_ID || "erp-ui";

/** SSO /auth/me — identity + global roles + auth-service permissions (step a). */
export const SSO_ME_URL = `${SSO_BASE_URL}/api/v1/auth/me`;

/** First path segments that are never tenant slugs. */
const RESERVED_SEGMENTS = new Set(["auth", "landing", "unauthorized", "healthz"]);

export interface AuthorizeParams {
  codeChallenge: string;
  state: string;
  redirectUri: string;
  scope?: string;
  /** Tenant hint so auth-api mints a token for the right org. */
  tenant?: string;
}

export interface TokenExchangeParams {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
}

export function buildAuthorizeUrl({
  codeChallenge,
  state,
  redirectUri,
  scope,
  tenant,
}: AuthorizeParams): string {
  const url = new URL("/api/v1/authorize", SSO_BASE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", SSO_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope || "openid profile email offline_access");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  // Only scope when the caller passes a real org slug. A guessed default caused
  // "not a member of the requested tenant"; the JWT always carries the real slug.
  const slug = tenant && !RESERVED_SEGMENTS.has(tenant) ? tenant : "";
  if (slug) {
    url.searchParams.set("tenant", slug);
    url.searchParams.set("org", slug);
  }
  return url.toString();
}

export function buildLogoutUrl(postLogoutRedirectUri?: string): string {
  const url = new URL("/api/v1/auth/logout", SSO_BASE_URL);
  if (postLogoutRedirectUri) {
    url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
  }
  return url.toString();
}

/**
 * Best-effort POST to revoke the user's backend session server-side.
 *
 * The GET /auth/logout redirect (buildLogoutUrl) only clears the bb_session
 * cookie. POST /auth/logout with the access token revokes ALL of the user's
 * sessions, deletes their Redis session_token keys, and clears the cookie.
 */
export async function revokeServerSession(accessToken?: string | null): Promise<void> {
  try {
    await fetch(new URL("/api/v1/auth/logout", SSO_BASE_URL).toString(), {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      credentials: "include",
      keepalive: true,
    });
  } catch { /* best-effort */ }
}

export async function exchangeCodeForTokens(params: TokenExchangeParams): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: SSO_CLIENT_ID,
    code_verifier: params.codeVerifier,
  });

  const response = await fetch(`${SSO_BASE_URL}/api/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error_description || err.error || `Token exchange failed (${response.status})`);
  }
  return response.json();
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(`${SSO_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken, client_id: SSO_CLIENT_ID }),
  });
  if (!response.ok) throw new Error("Token refresh failed");
  return response.json();
}
