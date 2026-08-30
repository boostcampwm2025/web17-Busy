import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicResponseDto as Music } from '@repo/dto';

import { usePlayerStore } from '@/stores/usePlayerStore';
import { clearGuestQueueSession, useGuestQueueSession } from './use-guest-queue-session';

const STORAGE_KEY = 'guest_queue_v1';

const music = (id: string) =>
  ({
    id,
    title: id,
    artistName: '가수',
    albumCoverUrl: 'https://example.com/cover.png',
    durationMs: 1000,
    provider: 'youtube',
    trackUri: `youtube:${id}`,
  }) as unknown as Music;

const advanceTimers = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

const storedPayload = () => {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as { queue: Music[]; currentMusic: Music | null; isPlaying: boolean }) : null;
};

describe('useGuestQueueSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    usePlayerStore.setState({ queue: [], currentMusic: null, isPlaying: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enabled가 false면 저장된 세션을 복원하지 않는다', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ queue: [music('a')], currentMusic: music('a'), isPlaying: true, savedAt: 0 }));

    renderHook(() => useGuestQueueSession(false));

    expect(usePlayerStore.getState().queue).toEqual([]);
    expect(usePlayerStore.getState().currentMusic).toBeNull();
  });

  it('저장된 세션이 없으면 아무 것도 복원하지 않는다', () => {
    renderHook(() => useGuestQueueSession(true));

    expect(usePlayerStore.getState().queue).toEqual([]);
    expect(usePlayerStore.getState().currentMusic).toBeNull();
  });

  it('저장된 값이 손상돼 있으면 조용히 무시한다', () => {
    sessionStorage.setItem(STORAGE_KEY, '{invalid json');

    expect(() => renderHook(() => useGuestQueueSession(true))).not.toThrow();
    expect(usePlayerStore.getState().queue).toEqual([]);
  });

  it('isPlaying이 true로 저장돼 있으면 그대로 재생 상태로 복원한다', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ queue: [music('a')], currentMusic: music('a'), isPlaying: true, savedAt: 0 }));

    renderHook(() => useGuestQueueSession(true));

    expect(usePlayerStore.getState().queue).toEqual([music('a')]);
    expect(usePlayerStore.getState().currentMusic).toEqual(music('a'));
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  /** playMusic이 재생을 켜므로, 저장된 isPlaying이 false면 되돌려 꺼야 한다. */
  it('isPlaying이 false로 저장돼 있으면 재생 상태를 다시 꺼서 복원한다', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ queue: [music('a')], currentMusic: music('a'), isPlaying: false, savedAt: 0 }));

    renderHook(() => useGuestQueueSession(true));

    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it('한 번 복원한 뒤 enabled가 꺼졌다 켜져도 다시 복원하지 않는다', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ queue: [music('a')], currentMusic: music('a'), isPlaying: true, savedAt: 0 }));

    const { rerender } = renderHook(({ enabled }: { enabled: boolean }) => useGuestQueueSession(enabled), { initialProps: { enabled: true } });
    expect(usePlayerStore.getState().currentMusic).toEqual(music('a'));

    usePlayerStore.setState({ currentMusic: null, queue: [] });
    rerender({ enabled: false });
    rerender({ enabled: true });

    expect(usePlayerStore.getState().currentMusic).toBeNull();
  });

  it('복원 후 상태가 바뀌면 500ms 뒤 세션에 저장한다', async () => {
    renderHook(() => useGuestQueueSession(true));

    act(() => usePlayerStore.setState({ queue: [music('a')], currentMusic: music('a'), isPlaying: true }));
    await advanceTimers(499);
    expect(storedPayload()).toBeNull();

    await advanceTimers(1);
    expect(storedPayload()).toMatchObject({ queue: [music('a')], currentMusic: music('a'), isPlaying: true });
  });

  it('enabled가 false면 상태가 바뀌어도 저장하지 않는다', async () => {
    renderHook(() => useGuestQueueSession(false));

    act(() => usePlayerStore.setState({ queue: [music('a')], currentMusic: music('a'), isPlaying: true }));
    await advanceTimers(500);

    expect(storedPayload()).toBeNull();
  });

  it('clearGuestQueueSession은 저장된 세션을 지운다', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ queue: [], currentMusic: null, isPlaying: false, savedAt: 0 }));

    clearGuestQueueSession();

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
