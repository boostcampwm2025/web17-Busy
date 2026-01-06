'use client';

import { useEffect } from 'react';

// root 페이지에서 사용
// root 페이지가 서버 컴포넌트일 수 있어서 클라이언트 컴포넌트로 구현
export default function SpotifyTokenFromHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('spotifyAccessToken');

    if (token) {
      // todo - zustand store에 저장

      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  return null;
}
