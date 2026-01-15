export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export const GOOGLE_SCOPES = ['openid', 'email', 'profile'] as const;

export const GOOGLE_COOKIE_KEYS = {
  PKCE_VERIFIER: 'google_pkce_verifier',
  OAUTH_STATE: 'google_oauth_state',
} as const;

export const GOOGLE_OAUTH_TMP_COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/api/auth/google',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 10, // 10분
} as const;

export const GOOGLE_AUTH_QUERY_KEYS = {
  LOGIN: 'login',
  AUTH_ERROR: 'authError',
} as const;
