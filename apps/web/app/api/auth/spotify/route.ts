import { NextResponse } from 'next/server';
import { createPkcePair } from '@/features/auth/server/pkce';
import { buildSpotifyAuthorizeUrl } from '@/features/auth/server/spotifyAuth';
import { SPOTIFY_COOKIE_KEYS } from '@/features/auth/config/spotify';

export async function GET() {
  const { verifier, challenge } = createPkcePair();

  const authorizeUrl = buildSpotifyAuthorizeUrl({
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
    codeChallenge: challenge,
  });

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(SPOTIFY_COOKIE_KEYS.PKCE_VERIFIER, verifier, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return res;
}
