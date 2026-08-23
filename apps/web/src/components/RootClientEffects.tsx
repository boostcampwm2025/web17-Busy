'use client';

import PwaRegister from '@/components/PwaRegister';
import { useNotificationsQuery } from '@/hooks/noti/use-notifications-query';
import SpotifyTokenFromHash from '@/hooks/auth/client/SpotifyTokenFromHash';
import { PrivacyConsentGate } from '@/hooks/privacy/PrivacyConsentGate';

const NOTI_POLLING_INTERVAL_MS = 5000;

export default function RootClientEffects() {
  useNotificationsQuery({ refetchIntervalMs: NOTI_POLLING_INTERVAL_MS });

  return (
    <>
      <PwaRegister />
      <SpotifyTokenFromHash />
      <PrivacyConsentGate />
    </>
  );
}
