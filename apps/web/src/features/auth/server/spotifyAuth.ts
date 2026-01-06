import { SPOTIFY_AUTH_URL, SPOTIFY_SCOPES } from '../config/spotify';

export function buildSpotifyAuthorizeUrl(params: { clientId: string; redirectUri: string; codeChallenge: string; state: string }) {
  const url = new URL(SPOTIFY_AUTH_URL);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('scope', SPOTIFY_SCOPES.join(' '));
  url.searchParams.set('state', params.state);
  return url.toString();
}

export async function exchangeSpotifyCodeWithBackend(args: { code: string; verifier: string }) {
  const backendUrl = process.env.BACKEND_URL!;
  const res = await fetch(`${backendUrl}/auth/spotify/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });

  if (!res.ok) return { ok: false as const };

  const data = (await res.json()) as {
    spotifyAccessToken: string;
    appJwt: string;
  };
  return { ok: true as const, ...data };
}
