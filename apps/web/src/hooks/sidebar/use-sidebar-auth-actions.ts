'use client';

import { useCallback } from 'react';

import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { useAuthMe } from '@/hooks/auth/client/use-auth-me';
import { performLogout } from '@/hooks/auth/client/logout';

/** 글쓰기 버튼과 로그인/로그아웃 버튼의 인증 가드. */
export function useSidebarAuthActions() {
  const openModal = useModalStore((s) => s.openModal);
  const { isAuthenticated, isLoading } = useAuthMe();

  const handleOpenWriteModal = useCallback(() => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    openModal(MODAL_TYPES.WRITE);
  }, [isAuthenticated, openModal]);

  const handleOpenLoginModal = useCallback(async () => {
    if (isLoading) return;

    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }

    await performLogout();
  }, [isLoading, isAuthenticated, openModal]);

  return { isAuthenticated, isLoading, handleOpenWriteModal, handleOpenLoginModal };
}
