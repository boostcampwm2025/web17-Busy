'use client';

import React from 'react';
import { useModalStore, useModalProps, MODAL_TYPES } from '@/stores/useModalStore';
import { getAuthErrorMessage } from '@/hooks/auth/client/auth-error-message';
import { CloseButton } from '@/components/common/CloseButton';
import { ModalShell } from '@/components/common/ModalShell';
import { GoogleLoginButton, TmpLoginButton } from './loginButtons';

export const LoginModal = () => {
  const closeModal = useModalStore((s) => s.closeModal);
  const authError = useModalProps(MODAL_TYPES.LOGIN)?.authError;
  const errorMessage = authError ? getAuthErrorMessage(authError) : undefined;

  return (
    <ModalShell onClose={closeModal} size="md">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white z-10 shrink-0">
        <h2 className="text-xl font-black text-primary">로그인</h2>
        <CloseButton onClose={closeModal} accentOnHover />
      </div>

      {/* 바디 */}
      <div className="px-10 py-20 flex flex-col gap-4">
        {errorMessage && (
          <div className="text-sm font-bold text-secondary border border-secondary/40 bg-secondary/5 rounded-xl px-4 py-3">{errorMessage}</div>
        )}
        <GoogleLoginButton />
        {process.env.NODE_ENV !== 'production' && <TmpLoginButton />}
      </div>
    </ModalShell>
  );
};
