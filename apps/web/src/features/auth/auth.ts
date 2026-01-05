import { SCOPES, SPOTIFY_AUTH_URL } from './constants';

const randomString = (length: number = 64) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input: any) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const getVerifier = () => {
  return randomString();
};

const getChallenge = async (verifier: string) => {
  const hased = await sha256(verifier);
  return base64encode(hased);
};

// 스포티파이 로그인 버튼 눌렀을 때 실행될 함수
export const loginWithSpotify = async () => {
  const verifier = getVerifier();
  const challenge = await getChallenge(verifier);

  // todo - 확인 필요
  // CSRF 방지용 state
  const state = randomString(32);

  const clinetId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clinetId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });

  const authorizeUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  window.location.assign(authorizeUrl);
};
