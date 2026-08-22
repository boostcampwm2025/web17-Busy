import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetRecentConsentListDto } from '@repo/dto';

import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/render-with-query-client';

import { recentConsentsQueryOptions, useRecentConsentsQuery } from './use-recent-consents-query';

const apiMocks = vi.hoisted(() => ({
  getRecentConsents: vi.fn(),
}));

vi.mock('@/api/internal/privacy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/privacy')>()),
  getRecentConsents: apiMocks.getRecentConsents,
}));

const consents = (terms: boolean, privacy: boolean): GetRecentConsentListDto =>
  ({
    items: [
      { type: 'TERMS', agreed: terms },
      { type: 'PRIVACY', agreed: privacy },
    ],
  }) as GetRecentConsentListDto;

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

describe('useRecentConsentsQuery', () => {
  beforeEach(() => {
    apiMocks.getRecentConsents.mockReset();
  });

  it('reads the recent consents into the shared cache key', async () => {
    apiMocks.getRecentConsents.mockResolvedValue(consents(true, false));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useRecentConsentsQuery(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.data).toEqual(consents(true, false)));
    expect(queryClient.getQueryData(queryKeys.consents.recent)).toEqual(consents(true, false));
  });

  /**
   * gate가 앱 시작 시 fetchQuery로 채워 둔 cache를 설정 화면이 그대로 쓴다.
   * 같은 엔드포인트를 두 번 조회하지 않는 것이 이 전환의 목적이다.
   */
  it('reuses the cache the gate already filled instead of fetching again', async () => {
    apiMocks.getRecentConsents.mockResolvedValue(consents(true, true));
    const queryClient = createTestQueryClient();

    await queryClient.fetchQuery(recentConsentsQueryOptions);
    expect(apiMocks.getRecentConsents).toHaveBeenCalledTimes(1);

    const { result } = renderHook(() => useRecentConsentsQuery(), { wrapper: createWrapper(queryClient) });

    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toEqual(consents(true, true));

    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(apiMocks.getRecentConsents).toHaveBeenCalledTimes(1);
  });

  it('refetches after the consent cache is invalidated', async () => {
    apiMocks.getRecentConsents.mockResolvedValueOnce(consents(false, false)).mockResolvedValueOnce(consents(true, true));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useRecentConsentsQuery(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.data).toEqual(consents(false, false)));

    await queryClient.invalidateQueries({ queryKey: queryKeys.consents.recent });

    await waitFor(() => expect(result.current.data).toEqual(consents(true, true)));
    expect(apiMocks.getRecentConsents).toHaveBeenCalledTimes(2);
  });

  it('surfaces the error instead of leaving the screen pending', async () => {
    apiMocks.getRecentConsents.mockRejectedValue(new Error('network'));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useRecentConsentsQuery(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isPending).toBe(false);
  });
});
