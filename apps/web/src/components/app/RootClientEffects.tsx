'use client';

import { useEffect } from 'react';

import PwaRegister from '@/components/app/PwaRegister';
import { useNotificationsQuery } from '@/hooks/noti/use-notifications-query';
import { PrivacyConsentGate } from '@/components/app/PrivacyConsentGate';
import { registerSessionExpiredHandler, SESSION_EXPIRED_CODE } from '@/api/internal/client';
import { clearClientSession } from '@/hooks/auth/client/logout';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { initLogQueue } from '@/utils/logQueue';

const NOTI_POLLING_INTERVAL_MS = 5000;

export default function RootClientEffects() {
  useNotificationsQuery({ refetchIntervalMs: NOTI_POLLING_INTERVAL_MS });

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      clearClientSession();

      const { isOpen, modalType, openModal } = useModalStore.getState();
      if (!(isOpen && modalType === MODAL_TYPES.LOGIN)) {
        openModal(MODAL_TYPES.LOGIN, { authError: SESSION_EXPIRED_CODE });
      }
    });
  }, []);

  // 이 호출이 탭 숨김 시 남은 로그를 보내는 리스너를 등록한다. 없으면 버퍼째 사라진다.
  useEffect(() => initLogQueue(), []);

  return (
    <>
      <PwaRegister />
      <PrivacyConsentGate />
    </>
  );
}
