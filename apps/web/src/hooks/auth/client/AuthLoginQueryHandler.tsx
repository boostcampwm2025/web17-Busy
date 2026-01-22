'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { APP_ACCESS_TOKEN_HASH_KEY, APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';

const QUERY_KEYS = {
  LOGIN: 'login',
  AUTH_ERROR: 'authError',
} as const;

function stripLoginQuery(pathname: string) {
  // login/authError 제거만 하면 됨
  return pathname;
}

export default function AuthLoginQueryHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { openModal, isOpen, modalType } = useModalStore();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const appJwt = params.get(APP_ACCESS_TOKEN_HASH_KEY);

    if (appJwt) {
      sessionStorage.setItem(APP_ACCESS_TOKEN_STORAGE_KEY, appJwt);
      // hash 재처리/상태 꼬임 방지를 위해 리로드로 인증 상태를 재평가
      window.location.assign('/');
      return;
    }

    const loginFlag = searchParams.get(QUERY_KEYS.LOGIN);
    if (loginFlag !== '1') return;

    const authError = searchParams.get(QUERY_KEYS.AUTH_ERROR) ?? undefined;

    // 이미 로그인 모달이 열려있으면 중복 오픈 방지
    if (!(isOpen && modalType === MODAL_TYPES.LOGIN)) {
      openModal(MODAL_TYPES.LOGIN, { authError });
    }

    // 쿼리 제거 (반복 오픈 방지)
    router.replace(stripLoginQuery(pathname));
  }, [isOpen, modalType, openModal, pathname, router, searchParams]);

  return null;
}
