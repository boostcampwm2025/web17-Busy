'use client';

import { useQuery } from '@tanstack/react-query';
import type { UserDto } from '@repo/dto';

import { authMe } from '@/api/internal/auth';
import { queryKeys } from '@/api/queryKeys';

export const AUTH_ME_STALE_TIME_MS = 5 * 60 * 1000;

type AuthMeState = {
  user: UserDto | null;
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export function useAuthMe(): AuthMeState {
  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authMe,
    retry: false,
    staleTime: AUTH_ME_STALE_TIME_MS,
  });

  const user = query.data ?? null;

  return {
    user,
    userId: user?.id ?? null,
    isAuthenticated: Boolean(user),
    isLoading: query.isLoading,
  };
}
