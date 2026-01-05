import { NextResponse } from 'next/server';
import crypto from 'crypto';

function base64UrlEncode(buffer: Buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function GET(request: Request) {
  const codeVerifier = base64UrlEncode(crypto.randomBytes(64));
  const hashed = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = base64UrlEncode(hashed);

  // 걍 cookie로 저장 (이걸 나중에 callback에서 불러서 exchange에 사용)
  const res = NextResponse.redirect(buildAuthorizeUrl(codeChallenge));
  res.cookies.set('spotify_pkce_verifier', codeVerifier, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return res;
}

function buildAuthorizeUrl(challenge: string) {
  const url = new URL('https://accounts.spotify.com/authorize');
  url.searchParams.set('client_id', process.env.SPOTIFY_CLIENT_ID!);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', process.env.SPOTIFY_REDIRECT_URI!);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', challenge);
  // 필요 scope들
  url.searchParams.set(
    'scope',
    [
      'user-read-email',
      'user-read-private',
      // 더 필요한 scope 추가
    ].join(' '),
  );

  return url.toString();
}
