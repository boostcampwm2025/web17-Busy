import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';

import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { MODAL_TYPES, useModalStore } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSpotifyAuthStore } from '@/stores/useSpotifyAuthStore';

import { internalClient } from './client';

const GUEST_QUEUE_STORAGE_KEY = 'guest_queue_v1';

/** 어떤 요청이든 401로 응답하는 어댑터. */
const respondWith401 = (config: InternalAxiosRequestConfig) => {
  const response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config };
  return Promise.reject(new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, null, response));
};

const fillLoggedInState = () => {
  sessionStorage.setItem(APP_ACCESS_TOKEN_STORAGE_KEY, 'app-jwt-token');
  sessionStorage.setItem(GUEST_QUEUE_STORAGE_KEY, JSON.stringify({ queue: [], currentMusic: null, isPlaying: false, savedAt: 0 }));
  useSpotifyAuthStore.setState({ accessToken: 'spotify-token', expiresAt: Date.now() + 10_000 });
};

describe('internalClient 401 handling', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useSpotifyAuthStore.getState().clear();
    usePlayerStore.getState().clearQueue();
    useModalStore.getState().closeModal();
    internalClient.defaults.adapter = respondWith401;
  });

  it('leaves the session alone when the request carried no token', async () => {
    sessionStorage.setItem(GUEST_QUEUE_STORAGE_KEY, 'kept');

    await expect(internalClient.get('/user/me')).rejects.toBeInstanceOf(AxiosError);

    expect(sessionStorage.getItem(GUEST_QUEUE_STORAGE_KEY)).toBe('kept');
    expect(useModalStore.getState().isOpen).toBe(false);
  });

  it('leaves the session alone for a 401 outside of authMe', async () => {
    fillLoggedInState();

    await expect(internalClient.get('/post/1')).rejects.toBeInstanceOf(AxiosError);

    expect(sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY)).toBe('app-jwt-token');
    expect(useSpotifyAuthStore.getState().accessToken).toBe('spotify-token');
    expect(useModalStore.getState().isOpen).toBe(false);
  });

  /**
   * 세션 만료 정리는 명시적 로그아웃과 같은 함수(clearClientSession)를 쓴다.
   * 예전에는 client.ts가 별도 clearAuthState를 들고 있어 게스트 큐 정리가 빠져 있었다.
   *
   * NOTE: 이 경로는 모듈 수준 handling401 플래그를 1초간 세우므로 마지막에 둔다.
   */
  it('runs the shared cleanup and opens the login modal when authMe returns 401', async () => {
    fillLoggedInState();

    await expect(internalClient.get('/user/me')).rejects.toBeInstanceOf(AxiosError);

    expect(sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(GUEST_QUEUE_STORAGE_KEY)).toBeNull();
    expect(useSpotifyAuthStore.getState().accessToken).toBeNull();

    expect(useModalStore.getState().isOpen).toBe(true);
    expect(useModalStore.getState().modalType).toBe(MODAL_TYPES.LOGIN);
    expect(useModalStore.getState().modalProps).toEqual({ authError: 'session_expired' });
  });
});
