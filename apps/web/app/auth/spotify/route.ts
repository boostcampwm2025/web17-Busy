import { NextResponse } from 'next/server';
import { createPkcePair } from '@/hooks/auth/server/pkce';
import { buildSpotifyAuthorizeUrl } from '@/hooks/auth/server/spotifyAuth';
import { SPOTIFY_COOKIE_KEYS, SPOTIFY_OAUTH_TMP_COOKIE_OPTIONS } from '@/hooks/auth/config/spotify';
import crypto from 'crypto';

export async function GET() {
  const { verifier, challenge } = createPkcePair();
  const state = crypto.randomUUID();

  const authorizeUrl = buildSpotifyAuthorizeUrl({
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
    codeChallenge: challenge,
    state,
  });

  // redirect
  const res = NextResponse.redirect(authorizeUrl);

  // verifier, state 쿠키에 저장
  res.cookies.set(SPOTIFY_COOKIE_KEYS.PKCE_VERIFIER, verifier, SPOTIFY_OAUTH_TMP_COOKIE_OPTIONS);
  res.cookies.set(SPOTIFY_COOKIE_KEYS.OAUTH_STATE, state, SPOTIFY_OAUTH_TMP_COOKIE_OPTIONS);

  return res;
}
