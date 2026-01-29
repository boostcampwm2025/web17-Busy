'use client';

import { useEffect, useRef } from 'react';
import { useAuthMe } from '../auth/client/useAuthMe';
import { MODAL_TYPES, useModalStore } from '@/stores';
import { getRecentConsents } from '@/api';

export function PrivacyConsentGate() {
  const { isAuthenticated, isLoading } = useAuthMe();
  const openModal = useModalStore((s) => s.openModal);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (isLoading || !isAuthenticated) return;

    ranRef.current = true;

    (async () => {
      const { items } = await getRecentConsents();
      const needsPrivacyConsent = items.length === 0;
      if (needsPrivacyConsent) {
        openModal(MODAL_TYPES.PRIVACY_CONCENT);
      }
    })().catch(() => {
      // 실패 시...?
    });
  }, [isLoading, isAuthenticated, openModal]);

  return null;
}
