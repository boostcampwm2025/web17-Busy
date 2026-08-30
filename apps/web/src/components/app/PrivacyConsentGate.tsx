'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { MODAL_TYPES, useModalStore } from '@/stores/useModalStore';
import { useAuthMe } from '@/hooks/auth/client/use-auth-me';
import { recentConsentsQueryOptions } from '@/hooks/privacy/use-recent-consents-query';

export function PrivacyConsentGate() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuthMe();
  const openModal = useModalStore((s) => s.openModal);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (isLoading || !isAuthenticated) return;

    ranRef.current = true;

    // 구독하지 않고 cache만 채운다. 재조회로 모달이 다시 열리면 안 되므로 한 번만 읽는다.
    queryClient
      .fetchQuery(recentConsentsQueryOptions)
      .then(({ items }) => {
        const needsPrivacyConsent = items.length === 0;
        if (needsPrivacyConsent) openModal(MODAL_TYPES.PRIVACY_CONCENT);
      })
      .catch(() => {
        // 동의 여부를 확인하지 못하면 모달을 띄우지 않는다. 다음 진입에서 다시 시도한다.
        ranRef.current = false;
      });
  }, [isLoading, isAuthenticated, openModal, queryClient]);

  return null;
}
