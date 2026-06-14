/** PKCE (RFC 7636) helpers for the OIDC Authorization Code flow. */

function b64urlEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return b64urlEncode(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await window.crypto.subtle.digest("SHA-256", data);
  return b64urlEncode(new Uint8Array(hash));
}

export function generateState(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return b64urlEncode(array);
}

export function storeVerifier(verifier: string) {
  sessionStorage.setItem("pkce_verifier", verifier);
}

export function getVerifier(): string | null {
  return sessionStorage.getItem("pkce_verifier");
}

export function removeVerifier(): void {
  sessionStorage.removeItem("pkce_verifier");
}

export function storeState(state: string) {
  sessionStorage.setItem("pkce_state", state);
}

export function getState(): string | null {
  return sessionStorage.getItem("pkce_state");
}

export function removeState(): void {
  sessionStorage.removeItem("pkce_state");
}
