'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { NotiResponseDto } from '@repo/dto';

import { fetchNotis } from '@/api/internal/noti';
import { queryKeys } from '@/api/queryKeys';
import { useAuthMe } from '@/hooks/auth/client/use-auth-me';

export type NotificationFetchStatus = 'no-login' | 'loading' | 'success' | 'error';

type Options = {
  refetchIntervalMs?: number;
};

const EMPTY_NOTIFICATIONS: NotiResponseDto[] = [];
const DEFAULT_ERROR_MESSAGE = '알림을 불러오지 못했습니다.';

export function useNotificationsQuery({ refetchIntervalMs }: Options = {}) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthMe();
  const isEnabled = isAuthenticated && !isAuthLoading;

  const query = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: fetchNotis,
    enabled: isEnabled,
    refetchInterval: isEnabled ? refetchIntervalMs : false,
    retry: false,
  });

  const notifications = query.data ?? EMPTY_NOTIFICATIONS;
  const unreadCount = useMemo(() => notifications.filter((noti) => !noti.isRead).length, [notifications]);

  const status: NotificationFetchStatus = !isEnabled ? 'no-login' : query.isLoading ? 'loading' : query.isError ? 'error' : 'success';
  const errorMessage = query.error instanceof Error ? query.error.message : DEFAULT_ERROR_MESSAGE;

  return {
    ...query,
    notifications,
    unreadCount,
    status,
    errorMessage,
  };
}
