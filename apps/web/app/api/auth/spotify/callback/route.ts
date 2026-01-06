import { NextRequest, NextResponse } from 'next/server';
import { exchangeSpotifyCodeWithBackend } from '@/features/auth/server/spotifyAuth';
import { SPOTIFY_COOKIE_KEYS } from '@/features/auth/config/spotify';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.redirect('/login');

  const verifier = request.cookies.get(SPOTIFY_COOKIE_KEYS.PKCE_VERIFIER)?.value;
  if (!verifier) return NextResponse.redirect('/login');

  const result = await exchangeSpotifyCodeWithBackend({
    backendUrl: process.env.BACKEND_URL!,
    code,
    verifier,
  });

  if (!result.ok) return NextResponse.redirect('/login');

  const res = NextResponse.redirect('/');
  res.cookies.set('jwt', result.jwt, { httpOnly: true, secure: true, sameSite: 'lax' });
  return res;
}
