'use client';

import React from 'react';
import { useModalStore } from '@/stores/useModalStore';
import { X } from 'lucide-react';
import { getAuthErrorMessage } from '@/hooks/auth/client/authErrorMessage';
import { GoogleLoginButton } from './loginButtons';

type LoginModalProps = {
  authError?: string;
};

export const LoginModal = () => {
  const { closeModal, modalProps } = useModalStore();
  const { authError } = (modalProps ?? {}) as LoginModalProps;
  const errorMessage = authError ? getAuthErrorMessage(authError) : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-[8px_8px_0px_0px_var(--color-primary)] border-2 border-primary flex flex-col overflow-hidden transition-all">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white z-10 shrink-0">
          <h2 className="text-xl font-black text-primary">로그인</h2>
          <button onClick={closeModal} className="p-1 hover:bg-gray-4 rounded-full transition-colors group" aria-label="닫기">
            <X className="w-6 h-6 text-primary group-hover:text-accent-pink transition-colors" />
          </button>
        </div>

        {/* 바디 */}
        <div className="px-10 py-20 flex flex-col gap-4">
          {errorMessage && (
            <div className="text-sm font-bold text-secondary border border-secondary/40 bg-secondary/5 rounded-xl px-4 py-3">{errorMessage}</div>
          )}
          <GoogleLoginButton />
          {/* <SpotifyLoginButton /> */}
        </div>
      </div>
    </div>
  );
};
