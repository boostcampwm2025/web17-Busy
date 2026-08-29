import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { MusicResponseDto as Music } from '@repo/dto';

import { usePlayerStore } from '@/stores/usePlayerStore';
import { useQueueNavigation } from './use-queue-navigation';

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

const QUEUE = [music('a'), music('b'), music('c')];

const navigateWith = (queue: Music[], currentMusic: Music | null) => {
  usePlayerStore.setState({ queue, currentMusic });
  return renderHook(() => useQueueNavigation()).result;
};

describe('useQueueNavigation', () => {
  beforeEach(() => {
    usePlayerStore.setState({ queue: [], currentMusic: null, isPlaying: false });
  });

  it('큐 가운데 곡이면 앞뒤로 모두 갈 수 있다', () => {
    const result = navigateWith(QUEUE, QUEUE[1]!);

    expect(result.current.canPrev).toBe(true);
    expect(result.current.canNext).toBe(true);
  });

  it('첫 곡이면 이전으로 못 간다', () => {
    const result = navigateWith(QUEUE, QUEUE[0]!);

    expect(result.current.canPrev).toBe(false);
    expect(result.current.canNext).toBe(true);
  });

  it('마지막 곡이면 다음으로 못 간다', () => {
    const result = navigateWith(QUEUE, QUEUE[2]!);

    expect(result.current.canPrev).toBe(true);
    expect(result.current.canNext).toBe(false);
  });

  it('재생 중인 곡이 없으면 앞뒤 모두 못 간다', () => {
    const result = navigateWith(QUEUE, null);

    expect(result.current.canPrev).toBe(false);
    expect(result.current.canNext).toBe(false);
  });

  // 큐에서 지워진 곡이 아직 currentMusic으로 남아 있으면 인덱스를 못 찾는다
  it('큐에 없는 곡이 재생 중이면 앞뒤 모두 못 간다', () => {
    const result = navigateWith(QUEUE, music('없는곡'));

    expect(result.current.canPrev).toBe(false);
    expect(result.current.canNext).toBe(false);
  });

  it('재생 중인 곡이 있으면 togglePlay가 재생 상태를 뒤집는다', () => {
    const result = navigateWith(QUEUE, QUEUE[0]!);

    act(() => result.current.togglePlay());

    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  // store의 togglePlay는 조건 없이 뒤집으므로 막는 건 이 훅의 몫이다
  it('재생 중인 곡이 없으면 togglePlay를 무시한다', () => {
    const result = navigateWith(QUEUE, null);

    act(() => result.current.togglePlay());

    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });
});
