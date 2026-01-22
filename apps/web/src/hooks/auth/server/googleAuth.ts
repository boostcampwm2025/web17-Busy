import { GOOGLE_AUTH_URL, GOOGLE_SCOPES } from '../config/google';

type BuildGoogleAuthorizeUrlParams = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
};

export function buildGoogleAuthorizeUrl(params: BuildGoogleAuthorizeUrlParams) {
  const url = new URL(GOOGLE_AUTH_URL);

  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_SCOPES.join(' '));

  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');

  // refresh_token 발급을 위해(필요 시)
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');

  return url.toString();
}
