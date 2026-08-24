import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicResponseDto as SavedMusic } from '@repo/dto';

import { createTestQueryClient } from '@/test/render-with-query-client';

import { usePlaylistSongsEditing } from './use-playlist-songs-editing';

const apiMocks = vi.hoisted(() => ({
  changeMusicOrderOfPlaylist: vi.fn(),
  addMusicsToPlaylist: vi.fn(),
}));

vi.mock('@/api/internal/playlist', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/playlist')>()),
  ...apiMocks,
}));

const PLAYLIST_ID = 'playlist-1';

const music = (id: string): SavedMusic => ({
  id,
  trackUri: `spotify:track:${id}`,
  provider: 'youtube' as SavedMusic['provider'],
  albumCoverUrl: `https://cdn.test/${id}.jpg`,
  title: `title-${id}`,
  artistName: `artist-${id}`,
  durationMs: 180000,
});

const SONGS = [music('a'), music('b'), music('c')];

const renderSongsEditing = (onReorderError = vi.fn(), onAddError = vi.fn()) => {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(() => usePlaylistSongsEditing({ playlistId: PLAYLIST_ID, songs: SONGS, onReorderError, onAddError }), { wrapper });
};

/** changeMusicOrderOfPlaylist는 id 배열만 받는다. */
const orderedIds = () => apiMocks.changeMusicOrderOfPlaylist.mock.calls.at(-1)?.[1];

describe('usePlaylistSongsEditing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.changeMusicOrderOfPlaylist.mockResolvedValue(undefined);
    apiMocks.addMusicsToPlaylist.mockResolvedValue({ addedMusics: [] });
  });

  it('선택을 토글한다', () => {
    const { result } = renderSongsEditing();

    act(() => result.current.toggleSelectSong('b'));
    expect([...result.current.selectedSongIds]).toEqual(['b']);

    act(() => result.current.toggleSelectSong('b'));
    expect(result.current.selectedSongIds.size).toBe(0);
  });

  it('선택한 곡을 뺀 목록으로 교체를 요청하고 선택을 비운다', async () => {
    const { result } = renderSongsEditing();

    act(() => result.current.toggleSelectSong('b'));
    await act(async () => result.current.deleteSelectedSongs());

    await waitFor(() => expect(orderedIds()).toEqual(['a', 'c']));
    expect(result.current.selectedSongIds.size).toBe(0);
  });

  it('moveSong은 자리를 맞바꾼 목록으로 요청한다', async () => {
    const { result } = renderSongsEditing();

    await act(async () => result.current.moveSong(1, 'up'));

    await waitFor(() => expect(orderedIds()).toEqual(['b', 'a', 'c']));
  });

  // 경계에서 요청이 나가면 서버는 같은 목록을 다시 받고 cache는 무효화된다.
  it('moveSong이 목록 끝을 넘어가면 요청하지 않는다', async () => {
    const { result } = renderSongsEditing();

    await act(async () => result.current.moveSong(0, 'up'));
    await act(async () => result.current.moveSong(SONGS.length - 1, 'down'));

    expect(apiMocks.changeMusicOrderOfPlaylist).not.toHaveBeenCalled();
  });

  it('moveSongTo는 곡을 뽑아 대상 위치에 끼운 목록으로 요청한다', async () => {
    const { result } = renderSongsEditing();

    await act(async () => result.current.moveSongTo(0, 2));

    await waitFor(() => expect(orderedIds()).toEqual(['b', 'c', 'a']));
  });

  it('moveSongTo가 제자리거나 범위 밖이면 요청하지 않는다', async () => {
    const { result } = renderSongsEditing();

    await act(async () => result.current.moveSongTo(1, 1));
    await act(async () => result.current.moveSongTo(-1, 0));
    await act(async () => result.current.moveSongTo(0, SONGS.length));

    expect(apiMocks.changeMusicOrderOfPlaylist).not.toHaveBeenCalled();
  });

  it('순서 교체가 실패하면 onReorderError를 부른다', async () => {
    const onReorderError = vi.fn();
    apiMocks.changeMusicOrderOfPlaylist.mockRejectedValue(new Error('boom'));

    const { result } = renderSongsEditing(onReorderError);

    act(() => result.current.moveSong(0, 'down'));

    await waitFor(() => expect(onReorderError).toHaveBeenCalled());
  });

  it('곡 추가가 실패하면 onAddError를 부른다', async () => {
    const onAddError = vi.fn();
    apiMocks.addMusicsToPlaylist.mockRejectedValue(new Error('boom'));

    const { result } = renderSongsEditing(vi.fn(), onAddError);

    act(() => result.current.addSong(music('d')));

    await waitFor(() => expect(onAddError).toHaveBeenCalled());
  });
});
