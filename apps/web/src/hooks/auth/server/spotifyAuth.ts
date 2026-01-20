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
