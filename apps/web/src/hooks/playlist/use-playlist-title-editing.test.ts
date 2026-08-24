import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MAX_PLAYLIST_TITLE_LENGTH } from '@/constants/playlist';

import { usePlaylistTitleEditing } from './use-playlist-title-editing';

const TITLE = '내 플레이리스트';

const renderTitleEditing = (onRename = vi.fn()) => ({
  onRename,
  ...renderHook(() => usePlaylistTitleEditing({ title: TITLE, onRename })),
});

describe('usePlaylistTitleEditing', () => {
  it('제목이 바뀌었을 때만 trim해서 rename을 요청한다', () => {
    const { result, onRename } = renderTitleEditing();

    act(() => result.current.start());
    act(() => result.current.change('  새 제목  '));
    act(() => result.current.commit());

    expect(onRename).toHaveBeenCalledWith('새 제목');
    expect(result.current.isEditing).toBe(false);
  });

  it('제목이 그대로면 rename을 요청하지 않는다', () => {
    const { result, onRename } = renderTitleEditing();

    act(() => result.current.start());
    act(() => result.current.change(`  ${TITLE}  `));
    act(() => result.current.commit());

    expect(onRename).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(false);
  });

  it('제목을 비우면 rename을 요청하지 않고 원래 제목으로 되돌린다', () => {
    const { result, onRename } = renderTitleEditing();

    act(() => result.current.start());
    act(() => result.current.change('   '));
    act(() => result.current.commit());

    expect(onRename).not.toHaveBeenCalled();
    expect(result.current.draft).toBe(TITLE);
  });

  // 길이 초과는 draft가 바뀐 바로 그 렌더에서 드러나야 한다.
  // effect로 뒤늦게 계산하면 그 사이 commit이 초과 제목을 통과시킨다.
  it('길이를 초과하면 같은 렌더에서 isInvalid가 서고 commit이 막힌다', () => {
    const { result, onRename } = renderTitleEditing();

    act(() => result.current.start());
    act(() => result.current.change('ㄱ'.repeat(MAX_PLAYLIST_TITLE_LENGTH + 1)));

    expect(result.current.isInvalid).toBe(true);

    act(() => result.current.commit());

    expect(onRename).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(true);
  });

  it('최대 길이까지는 허용한다', () => {
    const { result } = renderTitleEditing();

    act(() => result.current.start());
    act(() => result.current.change('ㄱ'.repeat(MAX_PLAYLIST_TITLE_LENGTH)));

    expect(result.current.isInvalid).toBe(false);
  });

  it('cancel하면 편집을 닫고 draft와 isInvalid를 되돌린다', () => {
    const { result, onRename } = renderTitleEditing();

    act(() => result.current.start());
    act(() => result.current.change('ㄱ'.repeat(MAX_PLAYLIST_TITLE_LENGTH + 1)));
    act(() => result.current.cancel());

    expect(result.current.isEditing).toBe(false);
    expect(result.current.draft).toBe(TITLE);
    expect(result.current.isInvalid).toBe(false);
    expect(onRename).not.toHaveBeenCalled();
  });
});
