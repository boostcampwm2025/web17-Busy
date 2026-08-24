import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { createTestQueryClient } from '@/test/render-with-query-client';

const apiMocks = vi.hoisted(() => ({
  tmpLogin: vi.fn(),
}));

vi.mock('@/api/internal/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/auth')>()),
  ...apiMocks,
}));

import { useTmpLoginMutation } from './use-tmp-login-mutation';

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

describe('useTmpLoginMutation', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    apiMocks.tmpLogin.mockReset().mockResolvedValue('app-jwt-token');
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: originalLocation });
  });

  /** 리로드가 먼저 일어나면 토큰이 없는 상태로 다시 시작해 로그인이 풀린다. */
  it('stores the token before reloading', async () => {
    const tokenAtReload: (string | null)[] = [];
    // jsdom의 location.assign은 redefine이 막혀 있어 location 자체를 갈아끼운다.
    const assign = vi.fn(() => tokenAtReload.push(sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY)));
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: { ...originalLocation, assign } });

    const { result } = renderHook(() => useTmpLoginMutation(), { wrapper: createWrapper(createTestQueryClient()) });
    result.current.mutate('user-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiMocks.tmpLogin).toHaveBeenCalledWith('user-1');
    expect(tokenAtReload).toEqual(['app-jwt-token']);
  });

  it('does not touch the session when the login fails', async () => {
    apiMocks.tmpLogin.mockRejectedValue(new Error('network'));
    const assign = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: { ...originalLocation, assign } });

    const { result } = renderHook(() => useTmpLoginMutation(), { wrapper: createWrapper(createTestQueryClient()) });
    result.current.mutate('user-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(assign).not.toHaveBeenCalled();
  });
});
