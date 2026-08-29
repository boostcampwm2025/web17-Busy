import { act, renderHook } from '@testing-library/react';
import type { RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicResponseDto as Music } from '@repo/dto';

import { usePlayerStore } from '@/stores/usePlayerStore';
import { useItunesSync } from './use-itunes-sync';

/**
 * 분리 전에는 이 로직이 165줄짜리 useItunesPlayback 안에 묻혀 있었고, Audio 객체도 훅이 내부에서
 * 만들어서 jsdom으로는 사실상 검증할 수 없었다. audioRef를 props로 받게 되면서 목을 꽂을 수 있다.
 */
const mockAudio = () =>
  ({
    volume: 1,
    loop: false,
    currentTime: 0,
    duration: Number.NaN,
    src: '',
    pause: vi.fn(),
    load: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
  }) as unknown as HTMLAudioElement;

const music = (id: string, overrides: Partial<Music> = {}) =>
  ({
    id,
    title: id,
    artistName: '가수',
    albumCoverUrl: 'https://example.com/cover.png',
    durationMs: 30_000,
    provider: 'itunes',
    trackUri: `https://example.com/${id}.m4a`,
    ...overrides,
  }) as unknown as Music;

const renderSync = (audio: HTMLAudioElement) => {
  const audioRef = { current: audio } as RefObject<HTMLAudioElement | null>;
  return renderHook(() => useItunesSync({ audioRef, setProgress: vi.fn() }));
};

describe('useItunesSync', () => {
  beforeEach(() => {
    usePlayerStore.setState({ currentMusic: null, isPlaying: false, volume: 0.5, playError: null, queue: [] });
  });

  it('마운트 시점의 볼륨을 엘리먼트에 반영한다', () => {
    usePlayerStore.setState({ volume: 0.3 });
    const audio = mockAudio();

    renderSync(audio);

    expect(audio.volume).toBe(0.3);
  });

  it('볼륨이 바뀌면 반영한다', () => {
    const audio = mockAudio();
    renderSync(audio);

    act(() => usePlayerStore.setState({ volume: 0.8 }));

    expect(audio.volume).toBe(0.8);
  });

  // 저장된 볼륨이 깨져 있어도 100%로 튀면 안 된다
  it('볼륨이 NaN이면 기본값으로 되돌린다', () => {
    usePlayerStore.setState({ volume: Number.NaN });
    const audio = mockAudio();

    renderSync(audio);

    expect(audio.volume).toBe(0.5);
  });

  it('큐에 곡이 하나뿐이면 loop를 켠다', () => {
    usePlayerStore.setState({ queue: [music('a')] });
    const audio = mockAudio();

    renderSync(audio);

    expect(audio.loop).toBe(true);
  });

  it('큐에 곡이 여러 개면 loop를 끈다', () => {
    usePlayerStore.setState({ queue: [music('a'), music('b')] });
    const audio = mockAudio();

    renderSync(audio);

    expect(audio.loop).toBe(false);
  });

  it('itunes 트랙으로 바뀌면 src를 갈아끼우고 load한다', () => {
    const audio = mockAudio();
    renderSync(audio);

    act(() => usePlayerStore.setState({ currentMusic: music('a') }));

    expect(audio.src).toBe('https://example.com/a.m4a');
    expect(audio.load).toHaveBeenCalled();
  });

  it('재생할 URL이 없으면 에러 메시지를 남긴다', () => {
    const audio = mockAudio();
    renderSync(audio);

    act(() => usePlayerStore.setState({ currentMusic: music('a', { trackUri: '' }) }));

    expect(usePlayerStore.getState().playError).toBe('재생할 수 있는 미리듣기 URL이 없습니다.');
  });

  it('itunes 트랙이 아니면 정지하고 src를 비운다', () => {
    const audio = mockAudio();
    audio.src = 'https://example.com/old.m4a';
    renderSync(audio);

    act(() => usePlayerStore.setState({ currentMusic: music('a', { provider: 'youtube' } as Partial<Music>) }));

    expect(audio.pause).toHaveBeenCalled();
    expect(audio.src).toBe('');
  });

  it('isPlaying이 true면 재생한다', () => {
    usePlayerStore.setState({ currentMusic: music('a') });
    const audio = mockAudio();
    renderSync(audio);

    act(() => usePlayerStore.setState({ isPlaying: true }));

    expect(audio.play).toHaveBeenCalled();
  });

  it('isPlaying이 false로 바뀌면 일시정지한다', () => {
    usePlayerStore.setState({ currentMusic: music('a'), isPlaying: true });
    const audio = mockAudio();
    renderSync(audio);

    act(() => usePlayerStore.setState({ isPlaying: false }));

    expect(audio.pause).toHaveBeenCalled();
  });
});
