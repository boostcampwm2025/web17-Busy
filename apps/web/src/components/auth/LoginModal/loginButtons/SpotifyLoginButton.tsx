'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export const SpotifyLoginButton = () => {
  const [loading, setLoading] = useState(false);

  const handleSpotifyLogin = () => {
    if (loading) return;
    setLoading(true);

    const url = new URL('/auth/spotify', window.location.origin);

    window.location.assign(url.toString());
  };

  return (
    <button
      type="button"
      onClick={handleSpotifyLogin}
      disabled={loading}
      aria-busy={loading}
      className={`
        w-full flex items-center justify-center gap-3
        px-6 py-4 rounded-full font-black
        border-none
        bg-[#1ED760] text-black
        hover:bg-[#1DB954]
        active:scale-[0.98]
        transition-all
        disabled:opacity-60 disabled:cursor-not-allowed
      `}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          Spotify로 이동 중…
        </>
      ) : (
        <>
          <Image src="/SpotifyLogo.svg" alt="Spotify" width={27} height={27} className="shrink-0" />
          Spotify로 로그인
        </>
      )}
    </button>
  );
};
