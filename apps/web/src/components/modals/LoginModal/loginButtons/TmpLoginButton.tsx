'use client';

import { authMe, tmpLogin } from '@/api';
import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { useModalStore } from '@/stores';
import React, { useState } from 'react';

export const TmpLoginButton = ({ userId, nickname }: { userId: string; nickname: string }) => {
  const { closeModal } = useModalStore();

  const [loading, setLoading] = useState(false);

  const handleTmpLogin = async () => {
    if (loading) return;
    setLoading(true);

    const appJwt = await tmpLogin(userId);
    sessionStorage.setItem(APP_ACCESS_TOKEN_STORAGE_KEY, appJwt);

    // me - 전역으로 관리하면 될 듯
    // const me = await authMe();

    setLoading(false);
    closeModal();

    // 인증 상태 반영을 위해 리로드(로그아웃과 동일 전략)
    window.location.assign('/');
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
