import { act, renderHook } from '@testing-library/react';
import type { RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicResponseDto as Music } from '@repo/dto';

import { usePlayerStore } from '@/stores/usePlayerStore';
import { useYouTubeSync } from './use-youtube-sync';

const mockPlayer = () =>
  ({
    mute: vi.fn(),
    unMute: vi.fn(),
    isMuted: vi.fn().mockReturnValue(false),
    setVolume: vi.fn(),
    stopVideo: vi.fn(),
    loadVideoById: vi.fn(),
    cueVideoById: vi.fn(),
    playVideo: vi.fn(),
    pauseVideo: vi.fn(),
    getDuration: vi.fn().mockReturnValue(0),
  }) as unknown as YT.Player;

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

describe('useYouTubeSync', () => {
  beforeEach(() => {
    usePlayerStore.setState({ currentMusic: null, isPlaying: false, volume: 0.5, playError: null });
  });

  // ready가 deps에 없으면 마운트 시점(player가 아직 없음)에 리턴하고, volume이 그대로면 다시 안 돈다
  it('플레이어가 준비되면(ready) 그 시점의 볼륨을 반영한다', () => {
    usePlayerStore.setState({ volume: 0.5 });
    const player = mockPlayer();
    const playerRef = { current: null } as RefObject<YT.Player | null>;
    const setProgress = vi.fn();

    const { rerender } = renderHook(({ ready }) => useYouTubeSync({ ready, playerRef, setProgress }), {
      initialProps: { ready: false },
    });

    expect(player.setVolume).not.toHaveBeenCalled();

    // onReady 콜백이 player 인스턴스를 채우고 ready를 true로 바꾸는 시점을 흉내낸다
    playerRef.current = player;
    rerender({ ready: true });

    expect(player.setVolume).toHaveBeenCalledWith(50);
  });

  it('볼륨이 0이면 mute하고 setVolume(0)을 호출한다', () => {
    usePlayerStore.setState({ volume: 0 });
    const player = mockPlayer();
    const playerRef = { current: player } as RefObject<YT.Player | null>;

    renderHook(() => useYouTubeSync({ ready: true, playerRef, setProgress: vi.fn() }));

    expect(player.mute).toHaveBeenCalled();
    expect(player.setVolume).toHaveBeenCalledWith(0);
  });

  it('볼륨을 0에서 올리면 음소거를 해제한다', () => {
    usePlayerStore.setState({ volume: 0 });
    const player = mockPlayer();
    player.isMuted = vi.fn().mockReturnValue(true);
    const playerRef = { current: player } as RefObject<YT.Player | null>;

    renderHook(() => useYouTubeSync({ ready: true, playerRef, setProgress: vi.fn() }));

    act(() => usePlayerStore.setState({ volume: 0.7 }));

    expect(player.unMute).toHaveBeenCalled();
    expect(player.setVolume).toHaveBeenCalledWith(70);
  });

  it('볼륨이 바뀌면 매번 반영한다 (기존 동작 유지)', () => {
    usePlayerStore.setState({ volume: 0.5 });
    const player = mockPlayer();
    const playerRef = { current: player } as RefObject<YT.Player | null>;

    renderHook(() => useYouTubeSync({ ready: true, playerRef, setProgress: vi.fn() }));

    act(() => usePlayerStore.setState({ volume: 0.9 }));

    expect(player.setVolume).toHaveBeenLastCalledWith(90);
  });

  it('현재 곡이 바뀌면 재생 에러 메시지를 초기화한다', () => {
    usePlayerStore.setState({ playError: '이전 에러', currentMusic: music('a') });
    const playerRef = { current: null } as RefObject<YT.Player | null>;

    renderHook(() => useYouTubeSync({ ready: false, playerRef, setProgress: vi.fn() }));

    act(() => usePlayerStore.setState({ currentMusic: music('b') }));

    expect(usePlayerStore.getState().playError).toBeNull();
  });
});
