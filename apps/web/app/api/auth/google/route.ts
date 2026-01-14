import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createPkcePair } from '@/features/auth/server/pkce';
import { buildGoogleAuthorizeUrl } from '@/features/auth/server/googleAuth';
import { GOOGLE_COOKIE_KEYS, GOOGLE_OAUTH_TMP_COOKIE_OPTIONS } from '@/features/auth/config/google';

export async function GET() {
  const { verifier, challenge } = createPkcePair();
  const state = crypto.randomUUID();

  const authorizeUrl = buildGoogleAuthorizeUrl({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    codeChallenge: challenge,
    state,
  });

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(GOOGLE_COOKIE_KEYS.PKCE_VERIFIER, verifier, GOOGLE_OAUTH_TMP_COOKIE_OPTIONS);
  res.cookies.set(GOOGLE_COOKIE_KEYS.OAUTH_STATE, state, GOOGLE_OAUTH_TMP_COOKIE_OPTIONS);

  return res;
}
