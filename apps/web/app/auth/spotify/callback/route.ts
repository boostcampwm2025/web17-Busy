import { NextRequest, NextResponse } from 'next/server';
import { SPOTIFY_COOKIE_KEYS } from '@/hooks/auth/config/spotify';
import { APP_ACCESS_TOKEN_HASH_KEY } from '@/constants/auth';
import { spotifyExchange } from '@/api';

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

  const result = await spotifyExchange({ code, verifier });
  if (!result.ok) return redirectAuthFail(request, 'token_exchange_failed');

  // access token - url fragment로 브라우저에 전달
  const url = new URL('/', request.url);
  url.hash = `${APP_ACCESS_TOKEN_HASH_KEY}=${encodeURIComponent(result.appJwt)}&spotifyAccessToken=${encodeURIComponent(result.spotifyAccessToken)}&spotifyTokenExpiresIn=${encodeURIComponent(result.spotifyTokenExpiresIn)}`;

  const res = NextResponse.redirect(url);
  deleteTmpCookies(res);

  // jwt - http only cookie로 브라우저에 전달
  res.cookies.set('jwt', result.appJwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });

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
  res.cookies.set(SPOTIFY_COOKIE_KEYS.PKCE_VERIFIER, '', { path: '/api/auth/spotify', maxAge: 0 });
  res.cookies.set(SPOTIFY_COOKIE_KEYS.OAUTH_STATE, '', { path: '/api/auth/spotify', maxAge: 0 });
}
