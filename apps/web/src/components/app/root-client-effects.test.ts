import { QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { MODAL_TYPES, useModalStore } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { createTestQueryClient } from '@/test/render-with-query-client';

// 이 테스트가 보는 것은 세션 만료 배선 하나뿐이라, 나머지 자식 효과는 렌더 비용만 늘린다.
vi.mock('@/components/app/PwaRegister', () => ({ default: () => null }));
vi.mock('@/components/app/PrivacyConsentGate', () => ({ PrivacyConsentGate: () => null }));
vi.mock('@/hooks/noti/use-notifications-query', () => ({ useNotificationsQuery: () => ({}) }));

import { internalClient } from '@/api/internal/client';

import RootClientEffects from './RootClientEffects';

const GUEST_QUEUE_STORAGE_KEY = 'guest_queue_v1';

const respondWith401 = (config: InternalAxiosRequestConfig) => {
  const response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config };
  return Promise.reject(new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, null, response));
};

const renderRoot = () => {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);

  return render(createElement(RootClientEffects), { wrapper });
};

describe('RootClientEffects session expiry wiring', () => {
  beforeEach(() => {
    sessionStorage.clear();
    usePlayerStore.getState().clearQueue();
    useModalStore.getState().closeModal();
    internalClient.defaults.adapter = respondWith401;
  });

  /**
   * client.ts는 utility 계층이라 세션 정리 방법을 모른다.
   * 정리와 모달 오픈은 여기서 등록한 핸들러가 담당한다.
   */
  it('clears the session and opens the login modal when authMe returns 401', async () => {
    sessionStorage.setItem(APP_ACCESS_TOKEN_STORAGE_KEY, 'app-jwt-token');
    sessionStorage.setItem(GUEST_QUEUE_STORAGE_KEY, JSON.stringify({ queue: [], currentMusic: null, isPlaying: false, savedAt: 0 }));

    renderRoot();

    await expect(internalClient.get('/user/me')).rejects.toBeInstanceOf(AxiosError);

    await waitFor(() => expect(useModalStore.getState().isOpen).toBe(true));
    expect(sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(GUEST_QUEUE_STORAGE_KEY)).toBeNull();

    expect(useModalStore.getState().modalType).toBe(MODAL_TYPES.LOGIN);
    expect(useModalStore.getState().modalProps).toEqual({ authError: 'session_expired' });
  });
});
