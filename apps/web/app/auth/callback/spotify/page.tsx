'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Spotify auth error:', error);
      router.replace('/login');
      return;
    }

    const savedState = sessionStorage.getItem('spotify_oauth_state');
    const verifier = sessionStorage.getItem('spotify_pkce_verifier');

    if (!code || !state || !verifier) {
      console.error('Missing code/state/verifier');
      router.replace('/login');
      return;
    }
    if (state !== savedState) {
      console.error('State mismatch');
      router.replace('/login');
      return;
    }

    (async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/spotify/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, verifier }),
      });

      if (!res.ok) {
        console.error('exchange failed');
        router.replace('/login');
      }

      // todo
      // res로부터 받은 access token과 jwt 처리

      router.replace('/');
    })();
  }, [searchParams, router]); // 의존성 배열 확인 필요

  return <div>Spotify 로그인 처리중...</div>;
}
