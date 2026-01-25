import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_AUTH_QUERY_KEYS, GOOGLE_COOKIE_KEYS } from '@/hooks/auth/config/google';
import { APP_ACCESS_TOKEN_HASH_KEY } from '@/constants/auth';
import { googleExchange } from '@/api';

const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN;

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

  const result = await googleExchange({ code, verifier });
  if (!result.ok) return redirectAuthFail(request, 'token_exchange_failed');

  const origin = APP_ORIGIN ?? request.nextUrl.origin;

  const url = new URL('/', origin);
  url.hash = `${APP_ACCESS_TOKEN_HASH_KEY}=${encodeURIComponent(result.appJwt)}`;

  const res = NextResponse.redirect(url);
  deleteTmpCookies(res);
  return res;
}

function redirectAuthFail(request: NextRequest, reason: string) {
  const origin = APP_ORIGIN ?? request.nextUrl.origin;

  const url = new URL('/', origin);
  url.searchParams.set(GOOGLE_AUTH_QUERY_KEYS.LOGIN, '1');
  url.searchParams.set(GOOGLE_AUTH_QUERY_KEYS.AUTH_ERROR, reason);

  const res = NextResponse.redirect(url);
  deleteTmpCookies(res);
  return res;
}

function deleteTmpCookies(res: NextResponse) {
  res.cookies.set(GOOGLE_COOKIE_KEYS.PKCE_VERIFIER, '', { path: '/auth/google', maxAge: 0 });
  res.cookies.set(GOOGLE_COOKIE_KEYS.OAUTH_STATE, '', { path: '/auth/google', maxAge: 0 });
}
