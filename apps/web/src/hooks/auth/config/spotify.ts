export const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';

// todo - 추후 세부 결정 필요
export const SPOTIFY_SCOPES = [
  'app-remote-control', // 모바일에서 필요
  'streaming',
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing',
];

export const SPOTIFY_COOKIE_KEYS = {
  PKCE_VERIFIER: 'spotify_pkce_verifier',
  OAUTH_STATE: 'spotify_oauth_state',
} as const;

export const SPOTIFY_OAUTH_TMP_COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/api/auth/spotify',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 10, // 10분
} as const;
