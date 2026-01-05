import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.redirect('/login');

  // 서버 cookie에 있는 verifier
  const verifier = request.cookies.get('spotify_pkce_verifier')?.value;
  if (!verifier) return NextResponse.redirect('/login');

  // 이제 이 서버에서 exchange 처리 (또는 클라로 code+verifier 넘기고 싶으면)
  const exchangeRes = await fetch(`${process.env.BACKEND_URL}/auth/spotify/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, verifier }),
  });

  if (!exchangeRes.ok) return NextResponse.redirect('/login');

  const { jwt } = await exchangeRes.json();

  const res = NextResponse.redirect('/');
  res.cookies.set('jwt', jwt, { httpOnly: true, secure: true, sameSite: 'lax' });

  return res;
}
