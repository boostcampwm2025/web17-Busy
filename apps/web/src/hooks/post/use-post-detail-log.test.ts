import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ enqueueLog: vi.fn() }));

vi.mock('@/utils/logQueue', () => ({ enqueueLog: mocks.enqueueLog }));

import { usePostDetailLog } from './use-post-detail-log';

type Props = Parameters<typeof usePostDetailLog>[0];

const baseProps: Props = {
  enabled: true,
  postId: 'post-1',
  userId: 'viewer-1',
  postMusicIds: [],
  isPlaying: false,
  currentMusicId: null,
};

const summaries = () =>
  mocks.enqueueLog.mock.calls.map((call) => call[0] as { eventType: string; targetPostId: string; meta: { playedMusicCount: number } });

describe('usePostDetailLog', () => {
  beforeEach(() => {
    mocks.enqueueLog.mockReset();
  });

  it('열람 1회당 1건만 기록한다', () => {
    const { unmount } = renderHook(() => usePostDetailLog(baseProps));

    unmount();

    expect(summaries()).toHaveLength(1);
    expect(summaries()[0]?.eventType).toBe('POST_DETAIL_SUMMARY');
    expect(summaries()[0]?.targetPostId).toBe('post-1');
  });

  it('열람 도중 로그인 확인이 끝나도 기록을 놓치지 않는다', () => {
    const { rerender, unmount } = renderHook((props: Props) => usePostDetailLog(props), {
      initialProps: { ...baseProps, userId: null } as Props,
    });

    rerender({ ...baseProps, userId: 'viewer-1' });
    expect(summaries()).toHaveLength(0); // 아직 열람 중이라 기록하지 않는다

    unmount();

    expect(summaries()).toHaveLength(1);
  });

  it('로그인하지 않은 열람은 기록하지 않는다', () => {
    const { unmount } = renderHook(() => usePostDetailLog({ ...baseProps, userId: null }));

    unmount();

    expect(summaries()).toHaveLength(0);
  });

  it('재생한 곡 수를 함께 기록한다', () => {
    const { result, unmount } = renderHook(() => usePostDetailLog({ ...baseProps, postMusicIds: ['m1', 'm2'] }));

    result.current.markMusicPlayed('m1');
    result.current.markMusicPlayed('m1'); // 같은 곡을 다시 재생해도 1곡이다
    result.current.markMusicPlayed('m2');
    unmount();

    expect(summaries()[0]?.meta.playedMusicCount).toBe(2);
  });

  it('다른 게시글로 바뀌면 이전 열람을 먼저 기록한다', () => {
    const { rerender, unmount } = renderHook((props: Props) => usePostDetailLog(props), { initialProps: baseProps });

    rerender({ ...baseProps, postId: 'post-2' });
    expect(summaries().map((s) => s.targetPostId)).toEqual(['post-1']);

    unmount();

    expect(summaries().map((s) => s.targetPostId)).toEqual(['post-1', 'post-2']);
  });

  it('닫힌 상태에서는 기록하지 않는다', () => {
    const { unmount } = renderHook(() => usePostDetailLog({ ...baseProps, enabled: false }));

    unmount();

    expect(summaries()).toHaveLength(0);
  });
});
