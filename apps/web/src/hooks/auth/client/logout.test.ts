import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicResponseDto as Music } from '@repo/dto';

import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';

import { clearClientSession, performLogout } from './logout';

const GUEST_QUEUE_STORAGE_KEY = 'guest_queue_v1';

const music = (id: string): Music =>
  ({
    id,
    title: '노래',
    artistName: '가수',
    albumCoverUrl: 'https://example.com/cover.png',
    durationMs: 1000,
    provider: 'youtube',
    trackUri: 'youtube:1',
  }) as unknown as Music;

/** 로그인 사용자가 쓰던 클라이언트 상태를 전부 채워 둔다. */
const fillLoggedInState = () => {
  sessionStorage.setItem(APP_ACCESS_TOKEN_STORAGE_KEY, 'app-jwt-token');
  sessionStorage.setItem(GUEST_QUEUE_STORAGE_KEY, JSON.stringify({ queue: [], currentMusic: null, isPlaying: false, savedAt: 0 }));
  usePlayerStore.setState({ queue: [music('music-1')], currentMusic: music('music-1'), isPlaying: true });
  useModalStore.getState().openModal(MODAL_TYPES.PLAYLIST_DETAIL);
};

describe('clearClientSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
    usePlayerStore.getState().clearQueue();
    useModalStore.getState().closeModal();
  });

  it('clears every piece of the logged-in session state', () => {
    fillLoggedInState();

    clearClientSession();

    expect(sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(usePlayerStore.getState().queue).toEqual([]);
    expect(usePlayerStore.getState().currentMusic).toBeNull();
    expect(useModalStore.getState().isOpen).toBe(false);
  });

  /**
   * 이전에는 401 경로(client.ts의 clearAuthState)만 이 정리를 빠뜨려서
   * 세션 만료 뒤에 예전 게스트 큐가 되살아날 수 있었다.
   */
  it('clears the guest queue session too', () => {
    fillLoggedInState();

    clearClientSession();

    expect(sessionStorage.getItem(GUEST_QUEUE_STORAGE_KEY)).toBeNull();
  });
});

describe('performLogout', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    useModalStore.getState().closeModal();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: originalLocation });
  });

  it('runs the shared cleanup and reloads the app', async () => {
    fillLoggedInState();
    const assign = vi.fn();
    // jsdom의 location.assign은 redefine이 막혀 있어 location 자체를 갈아끼운다.
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: { ...originalLocation, assign } });

    await performLogout();

    expect(sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(GUEST_QUEUE_STORAGE_KEY)).toBeNull();
    expect(usePlayerStore.getState().queue).toEqual([]);
    expect(assign).toHaveBeenCalledWith('/');
  });
});
