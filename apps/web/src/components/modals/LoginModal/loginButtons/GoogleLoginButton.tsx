'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const GOOGLE_AUTH_START_PATH = '/auth/google';

export const GoogleLoginButton = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    if (loading) return;
    setLoading(true);
    window.location.assign(GOOGLE_AUTH_START_PATH);
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      aria-busy={loading}
      className="
        w-full flex items-center justify-center gap-3
        px-6 py-4 rounded-full font-black
        border border-primary
        bg-white text-primary
        hover:bg-gray-50
        active:scale-[0.98]
        transition-all
        disabled:opacity-60 disabled:cursor-not-allowed
      "
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Google로 이동 중…
        </>
      ) : (
        <>
          <Image src="/Google.svg" alt="Spotify" width={27} height={27} className="shrink-0" />
          Google로 로그인
        </>
      )}
    </button>
  );
};
