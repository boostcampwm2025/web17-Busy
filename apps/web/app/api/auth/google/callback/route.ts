import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCodeWithBackend } from '@/features/auth/server/googleAuth';
import { GOOGLE_AUTH_QUERY_KEYS, GOOGLE_COOKIE_KEYS } from '@/features/auth/config/google';

const JWT_COOKIE_NAME = 'jwt';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const error = searchParams.get('error');
  if (error) return redirectAuthFail(request, `google_error_${error}`);

  const code = searchParams.get('code');
  if (!code) return redirectAuthFail(request, 'no_authorization_code');

  const verifier = request.cookies.get(GOOGLE_COOKIE_KEYS.PKCE_VERIFIER)?.value;
  if (!verifier) return redirectAuthFail(request, 'missing_verifier');

  const stateCookie = request.cookies.get(GOOGLE_COOKIE_KEYS.OAUTH_STATE)?.value;
  const stateQuery = searchParams.get('state');

  if (!stateCookie) return redirectAuthFail(request, 'missing_state_cookie');
  if (!stateQuery) return redirectAuthFail(request, 'missing_state_query');
  if (stateCookie !== stateQuery) return redirectAuthFail(request, 'state_mismatch');

  const result = await exchangeGoogleCodeWithBackend({ code, verifier });
  if (!result.ok) return redirectAuthFail(request, 'token_exchange_failed');

  const res = NextResponse.redirect(new URL('/', request.url));
  deleteTmpCookies(res);

  res.cookies.set(JWT_COOKIE_NAME, result.appJwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res;
}

function redirectAuthFail(request: NextRequest, reason: string) {
  const url = new URL('/', request.url);
  url.searchParams.set(GOOGLE_AUTH_QUERY_KEYS.LOGIN, '1');
  url.searchParams.set(GOOGLE_AUTH_QUERY_KEYS.AUTH_ERROR, reason);

  const res = NextResponse.redirect(url);
  deleteTmpCookies(res);

  return res;
}

function deleteTmpCookies(res: NextResponse) {
  res.cookies.set(GOOGLE_COOKIE_KEYS.PKCE_VERIFIER, '', {
    path: '/api/auth/google',
    maxAge: 0,
  });
  res.cookies.set(GOOGLE_COOKIE_KEYS.OAUTH_STATE, '', {
    path: '/api/auth/google',
    maxAge: 0,
  });
}
