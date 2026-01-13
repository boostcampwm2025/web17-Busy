'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export const TmpLoginButton = ({ userId, nickname }: { userId: string; nickname: string }) => {
  const [loading, setLoading] = useState(false);

  const handleTmpLogin = async () => {
    if (loading) return;
    setLoading(true);

    // 로그인 요청
    const url = new URL('/auth/login/tmp', process.env.NEXT_PUBLIC_APP_URL!);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) throw new Error('로그인에 실패했습니다.');
  };

  return (
    <button
      type="button"
      onClick={handleTmpLogin}
      disabled={loading}
      aria-busy={loading}
      className={`
        w-full flex items-center justify-center gap-3
        px-6 py-4 rounded-full font-black
        border border-dashed border-gray-400
        bg-white text-gray-800
        hover:bg-gray-100 hover:border-gray-500
        active:scale-[0.98]
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          {nickname} 로 로그인 중...
        </>
      ) : (
        <>{nickname} 로 로그인</>
      )}
    </button>
  );
};
