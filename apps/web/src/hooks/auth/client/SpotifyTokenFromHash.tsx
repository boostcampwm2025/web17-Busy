'use client';

import { useSpotifyAuthStore } from '@/stores/useSpotifyAuthStore';
import { useEffect } from 'react';

// root 페이지에서 사용
// root 페이지가 서버 컴포넌트일 수 있어서 클라이언트 컴포넌트로 구현
export default function SpotifyTokenFromHash() {
  const setAccessToken = useSpotifyAuthStore((s) => s.setAccessToken);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('spotifyAccessToken');
    const expiresInStr = params.get('spotifyTokenExpiresIn');

    if (!token || !expiresInStr) return;

    const expiresIn = Number(expiresInStr);
    if (Number.isNaN(expiresIn)) return;

    setAccessToken(token, expiresIn);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [setAccessToken]);

  return null;
}
