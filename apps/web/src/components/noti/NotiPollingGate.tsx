'use client';

import useNotiPolling from '@/hooks/noti/useNotiPolling';

export default function NotiPollingGate() {
  useNotiPolling();
  return null;
}
