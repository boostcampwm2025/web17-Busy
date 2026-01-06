import { NextRequest, NextResponse } from 'next/server';
import { exchangeSpotifyCodeWithBackend } from '@/features/auth/server/spotifyAuth';
import { SPOTIFY_COOKIE_KEYS } from '@/features/auth/config/spotify';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const spotifyError = searchParams.get('error');
  if (spotifyError) return redirectAuthFail(request, `spotify_error_${spotifyError}`);

  const code = searchParams.get('code');
  if (!code) return redirectAuthFail(request, 'no_authorization_code');

  const verifier = request.cookies.get(SPOTIFY_COOKIE_KEYS.PKCE_VERIFIER)?.value;
  if (!verifier) return redirectAuthFail(request, 'missing_verifier');

  const stateCookie = request.cookies.get(SPOTIFY_COOKIE_KEYS.OAUTH_STATE)?.value;
  const stateQuery = searchParams.get('state');

  if (!stateCookie) return redirectAuthFail(request, 'missing_state_cookie');
  if (!stateQuery) return redirectAuthFail(request, 'missing_state_query');
  if (stateCookie !== stateQuery) return redirectAuthFail(request, 'state_mismatch');

  const result = await exchangeSpotifyCodeWithBackend({ code, verifier });

  if (!result.ok) return redirectAuthFail(request, 'token_exchange_failed');

  const res = NextResponse.redirect('/');
  deleteTmpCookies(res);

  res.cookies.set('jwt', result.appJwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });

  // todo access token은?
  return res;
}

// '/' 로 리다이렉트 할 때 login, authError 정보 전달
// login=1 - 로그인 모달 열라는 flag
function redirectAuthFail(request: NextRequest, reason: string) {
  const url = new URL('/', request.url);
  url.searchParams.set('login', '1');
  url.searchParams.set('authError', reason);

  const res = NextResponse.redirect(url);

  deleteTmpCookies(res);

  return res;
}

function deleteTmpCookies(res: NextResponse) {
  res.cookies.delete(SPOTIFY_COOKIE_KEYS.PKCE_VERIFIER);
  res.cookies.delete(SPOTIFY_COOKIE_KEYS.OAUTH_STATE);
}
