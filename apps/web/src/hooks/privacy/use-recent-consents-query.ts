'use client';

import { useQuery } from '@tanstack/react-query';

import { getRecentConsents, queryKeys } from '@/api';

/**
 * 동의 내역은 사용자가 폼을 제출할 때만 바뀐다. 제출 후에는 cache를 무효화하므로
 * 그 사이에는 화면을 오갈 때마다 다시 조회하지 않는다.
 */
export const CONSENTS_STALE_TIME_MS = 5 * 60 * 1000;

/** 앱 시작 시의 gate와 설정 화면이 같은 cache를 쓰도록 조회 조건을 한 곳에 둔다. */
export const recentConsentsQueryOptions = {
  queryKey: queryKeys.consents.recent,
  queryFn: getRecentConsents,
  staleTime: CONSENTS_STALE_TIME_MS,
} as const;

/**
 * 로그인 사용자의 최근 동의 내역.
 * `PrivacyConsentGate`가 앱 시작 시 같은 key를 채워 두므로 설정 화면은 그 결과를 재사용한다.
 */
export const useRecentConsentsQuery = () => useQuery(recentConsentsQueryOptions);
