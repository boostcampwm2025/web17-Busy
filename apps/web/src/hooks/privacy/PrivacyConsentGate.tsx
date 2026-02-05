'use client';

import { useEffect, useRef } from 'react';
import { MODAL_TYPES, useAuthStore, useModalStore } from '@/stores';
import { getRecentConsents } from '@/api';

export function PrivacyConsentGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
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
