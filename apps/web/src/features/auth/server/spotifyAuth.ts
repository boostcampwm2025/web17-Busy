import { SPOTIFY_AUTH_URL, SPOTIFY_SCOPES } from '../config/spotify';

export function buildSpotifyAuthorizeUrl(params: { clientId: string; redirectUri: string; codeChallenge: string }) {
  const url = new URL(SPOTIFY_AUTH_URL);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('scope', SPOTIFY_SCOPES.join(' '));
  return url.toString();
}

export async function exchangeSpotifyCodeWithBackend(args: { backendUrl: string; code: string; verifier: string }) {
  const res = await fetch(`${args.backendUrl}/auth/spotify/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: args.code, verifier: args.verifier }),
  });

  if (!res.ok) return { ok: false as const };

  const data = (await res.json()) as { jwt: string };
  return { ok: true as const, jwt: data.jwt };
}
