'use client';

import { useQuery } from '@tanstack/react-query';

import { getUser, queryKeys } from '@/api';

export const useProfileQuery = (userId: string) =>
  useQuery({
    queryKey: queryKeys.profiles.detail(userId),
    queryFn: () => getUser(userId),
    enabled: Boolean(userId),
  });
