import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetRecentConsentListDto, UpdateConsentListDto } from '@repo/dto';
import { ConsentType } from '@repo/dto/values';

import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/render-with-query-client';

const apiMocks = vi.hoisted(() => ({
  updatePrivacyConsent: vi.fn(),
  getRecentConsents: vi.fn(),
}));

vi.mock('@/api/internal/privacy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/privacy')>()),
  ...apiMocks,
}));

import { useRecentConsentsQuery } from './use-recent-consents-query';
import { useUpdatePrivacyConsentMutation } from './use-update-privacy-consent-mutation';

const consents = (agreed: boolean): GetRecentConsentListDto =>
  ({
    items: [
      { type: ConsentType.TERMS_OF_SERVICE, agreed },
      { type: ConsentType.PRIVACY_POLICY, agreed },
    ],
  }) as unknown as GetRecentConsentListDto;

const agreeToAll: UpdateConsentListDto = {
  items: [
    { type: ConsentType.TERMS_OF_SERVICE, agreed: true },
    { type: ConsentType.PRIVACY_POLICY, agreed: true },
  ],
} as unknown as UpdateConsentListDto;

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

describe('useUpdatePrivacyConsentMutation', () => {
  beforeEach(() => {
    apiMocks.updatePrivacyConsent.mockReset().mockResolvedValue(undefined);
    apiMocks.getRecentConsents.mockReset();
  });

  /**
   * 동의 내역 조회는 staleTime이 5분이라 무효화하지 않으면 제출 직후에도 예전 상태가 보인다.
   * 이전에는 설정 화면만 무효화해서, 모달로 동의한 사용자는 화면마다 상태가 어긋났다.
   */
  it('refreshes the recent consents after a submit', async () => {
    apiMocks.getRecentConsents.mockResolvedValueOnce(consents(false)).mockResolvedValueOnce(consents(true));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => ({ recent: useRecentConsentsQuery(), update: useUpdatePrivacyConsentMutation() }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.recent.data).toEqual(consents(false)));

    result.current.update.mutate(agreeToAll);

    await waitFor(() => expect(result.current.recent.data).toEqual(consents(true)));
    expect(apiMocks.updatePrivacyConsent).toHaveBeenCalledWith(agreeToAll);
  });

  it('keeps the cached consents when the request fails', async () => {
    apiMocks.updatePrivacyConsent.mockRejectedValue(new Error('network'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.consents.recent, consents(false));

    const { result } = renderHook(() => useUpdatePrivacyConsentMutation(), { wrapper: createWrapper(queryClient) });
    result.current.mutate(agreeToAll);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(queryKeys.consents.recent)).toEqual(consents(false));
  });
});
