import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicResponseDto as Music } from '@repo/dto';

const mocks = vi.hoisted(() => ({
  isAuthenticated: true,
  openWriteModalWithMusic: vi.fn(),
  addMusicToArchive: vi.fn(),
}));

vi.mock('@/hooks/auth/client/useAuthMe', () => ({
  useAuthMe: () => ({ user: null, userId: null, isAuthenticated: mocks.isAuthenticated, isLoading: false }),
}));

vi.mock('@/hooks/common/use-music-actions', () => ({
  default: () => ({
    openWriteModalWithMusic: mocks.openWriteModalWithMusic,
    addMusicToArchive: mocks.addMusicToArchive,
  }),
}));

import { MODAL_TYPES, useModalStore } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useCurrentMusicActions } from './use-current-music-actions';

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

const CURRENT = music('a');

const actionsWith = ({ isAuthenticated, currentMusic }: { isAuthenticated: boolean; currentMusic: Music | null }) => {
  mocks.isAuthenticated = isAuthenticated;
  usePlayerStore.setState({ currentMusic });
  return renderHook(() => useCurrentMusicActions()).result;
};

describe('useCurrentMusicActions', () => {
  beforeEach(() => {
    mocks.openWriteModalWithMusic.mockReset().mockResolvedValue(undefined);
    mocks.addMusicToArchive.mockReset().mockResolvedValue(undefined);
    usePlayerStore.setState({ currentMusic: null });
    useModalStore.getState().closeModal();
  });

  it('로그인한 사용자의 post는 현재 곡으로 작성 모달을 연다', () => {
    const result = actionsWith({ isAuthenticated: true, currentMusic: CURRENT });

    act(() => result.current.post());

    expect(mocks.openWriteModalWithMusic).toHaveBeenCalledWith(CURRENT);
  });

  it('로그인한 사용자의 save는 현재 곡을 보관함으로 넘긴다', () => {
    const result = actionsWith({ isAuthenticated: true, currentMusic: CURRENT });

    act(() => result.current.save());

    expect(mocks.addMusicToArchive).toHaveBeenCalledWith(CURRENT);
  });

  it('로그인하지 않았으면 로그인 모달을 열고 액션은 호출하지 않는다', () => {
    const result = actionsWith({ isAuthenticated: false, currentMusic: CURRENT });

    act(() => result.current.post());

    expect(useModalStore.getState().modalType).toBe(MODAL_TYPES.LOGIN);
    expect(mocks.openWriteModalWithMusic).not.toHaveBeenCalled();
  });

  it('로그인하지 않았으면 save도 막힌다', () => {
    const result = actionsWith({ isAuthenticated: false, currentMusic: CURRENT });

    act(() => result.current.save());

    expect(useModalStore.getState().modalType).toBe(MODAL_TYPES.LOGIN);
    expect(mocks.addMusicToArchive).not.toHaveBeenCalled();
  });

  // 로그인은 됐지만 재생 중인 곡이 없는 상태. 로그인 모달까지 뜨면 오히려 혼란스럽다
  it('재생 중인 곡이 없으면 아무것도 하지 않는다', () => {
    const result = actionsWith({ isAuthenticated: true, currentMusic: null });

    act(() => {
      result.current.post();
      result.current.save();
    });

    expect(mocks.openWriteModalWithMusic).not.toHaveBeenCalled();
    expect(mocks.addMusicToArchive).not.toHaveBeenCalled();
    expect(useModalStore.getState().isOpen).toBe(false);
  });
});

/** post·save는 memo()인 NowPlayingMetaActions의 props로 그대로 들어간다. */
describe('useCurrentMusicActions 참조 동일성', () => {
  beforeEach(() => {
    mocks.isAuthenticated = true;
    usePlayerStore.setState({ currentMusic: CURRENT });
  });

  it('판단에 쓰는 값이 그대로면 리렌더해도 같은 핸들러를 준다', () => {
    const { result, rerender } = renderHook(() => useCurrentMusicActions());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  // deps를 비워서 고정하면 여기서 걸린다. 이전 곡을 담은 핸들러가 그대로 남기 때문
  it('현재 곡이 바뀌면 새 핸들러를 만든다', () => {
    const { result } = renderHook(() => useCurrentMusicActions());
    const first = result.current;

    act(() => usePlayerStore.setState({ currentMusic: music('b') }));

    expect(result.current).not.toBe(first);
  });
});
