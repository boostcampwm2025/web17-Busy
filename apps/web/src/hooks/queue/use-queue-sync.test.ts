import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicResponseDto as Music } from '@repo/dto';

import { usePlayerStore } from '@/stores/usePlayerStore';

const apiMocks = vi.hoisted(() => ({
  getNowPlaylist: vi.fn(),
  updateNowPlaylist: vi.fn(),
}));
vi.mock('@/api/internal/now-playlist', () => ({
  getNowPlaylist: apiMocks.getNowPlaylist,
  updateNowPlaylist: apiMocks.updateNowPlaylist,
}));

import { useQueueSync } from './use-queue-sync';

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

const flush = () => advanceTimers(0);

describe('useQueueSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    usePlayerStore.setState({ queue: [] });
    apiMocks.getNowPlaylist.mockReset().mockResolvedValue([]);
    apiMocks.updateNowPlaylist.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enabled가 false면 서버 큐를 조회하지 않는다', async () => {
    renderHook(() => useQueueSync({ enabled: false }));

    await flush();

    expect(apiMocks.getNowPlaylist).not.toHaveBeenCalled();
  });

  it('enabled면 서버 큐를 조회해 스토어에 반영한다', async () => {
    const serverQueue = [music('a'), music('b')];
    apiMocks.getNowPlaylist.mockResolvedValue(serverQueue);

    renderHook(() => useQueueSync({ enabled: true }));
    await flush();

    expect(usePlayerStore.getState().queue).toEqual(serverQueue);
  });

  it('로드 후 큐가 바뀌면 1500ms 뒤에만 서버에 저장한다', async () => {
    renderHook(() => useQueueSync({ enabled: true }));
    await flush();

    act(() => usePlayerStore.setState({ queue: [music('a')] }));
    await advanceTimers(1499);
    expect(apiMocks.updateNowPlaylist).not.toHaveBeenCalled();

    await advanceTimers(1);
    expect(apiMocks.updateNowPlaylist).toHaveBeenCalledWith([music('a')]);
  });

  it('저장이 실패하면 이후 큐 변경은 더 이상 서버에 보내지 않는다', async () => {
    apiMocks.updateNowPlaylist.mockRejectedValueOnce(new Error('fail'));
    renderHook(() => useQueueSync({ enabled: true }));
    await flush();

    act(() => usePlayerStore.setState({ queue: [music('a')] }));
    await advanceTimers(1500);
    expect(apiMocks.updateNowPlaylist).toHaveBeenCalledTimes(1);

    apiMocks.updateNowPlaylist.mockClear();
    act(() => usePlayerStore.setState({ queue: [music('a'), music('b')] }));
    await advanceTimers(1500);

    expect(apiMocks.updateNowPlaylist).not.toHaveBeenCalled();
  });

  it('초기 조회가 실패하면 sync 자체를 중단한다', async () => {
    apiMocks.getNowPlaylist.mockRejectedValue(new Error('fail'));
    renderHook(() => useQueueSync({ enabled: true }));
    await flush();

    act(() => usePlayerStore.setState({ queue: [music('a')] }));
    await advanceTimers(1500);

    expect(apiMocks.updateNowPlaylist).not.toHaveBeenCalled();
  });

  it('enabled가 꺼졌다 다시 켜지면 서버 큐를 재조회한다', async () => {
    const { rerender } = renderHook(({ enabled }: { enabled: boolean }) => useQueueSync({ enabled }), { initialProps: { enabled: true } });
    await flush();
    expect(apiMocks.getNowPlaylist).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    rerender({ enabled: true });
    await flush();

    expect(apiMocks.getNowPlaylist).toHaveBeenCalledTimes(2);
  });
});
