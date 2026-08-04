'use client';

import { useNotificationsQuery } from './use-notifications-query';

const NOTI_POLLING_INTERVAL_MS = 5000;

export default function useNotiPolling() {
  useNotificationsQuery({ refetchIntervalMs: NOTI_POLLING_INTERVAL_MS });
}
