import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicResponseDto as Music } from '@repo/dto';

import { createTestQueryClient } from '@/test/render-with-query-client';

import { usePlaylistPicker } from './use-playlist-picker';

const apiMocks = vi.hoisted(() => ({
  getAllPlaylists: vi.fn(),
  addMusicsToPlaylist: vi.fn(),
  createNewPlaylist: vi.fn(),
}));

vi.mock('@/api/internal/playlist', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/playlist')>()),
  ...apiMocks,
}));

const music = (id: string): Music => ({
  id,
  trackUri: `spotify:track:${id}`,
  provider: 'youtube' as Music['provider'],
  albumCoverUrl: `https://cdn.test/${id}.jpg`,
  title: `title-${id}`,
  artistName: `artist-${id}`,
  durationMs: 180000,
});

const MUSICS = [music('a')];

const renderPicker = (musics = MUSICS, onSaved = vi.fn()) => {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(() => usePlaylistPicker({ musics, onSaved }), { wrapper });
};

describe('usePlaylistPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getAllPlaylists.mockResolvedValue([]);
    apiMocks.addMusicsToPlaylist.mockResolvedValue({ addedMusics: [music('a')] });
    apiMocks.createNewPlaylist.mockResolvedValue({ id: 'new-playlist', title: '새 플레이리스트' });
  });

  it('musics가 비어있으면 canSubmit이 false다', () => {
    const { result } = renderPicker([]);

    expect(result.current.canSubmit).toBe(false);
  });

  it('플레이리스트를 골라 저장하면 onSaved를 부른다', async () => {
    const onSaved = vi.fn();
    const { result } = renderPicker(MUSICS, onSaved);

    await act(async () => result.current.handleSelect('playlist-1'));

    expect(apiMocks.addMusicsToPlaylist).toHaveBeenCalledWith('playlist-1', [expect.objectContaining({ id: 'a' })]);
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.errorMsg).toBeNull();
  });

  it('중복된 곡은 하나로 합쳐 요청한다', async () => {
    const { result } = renderPicker([music('a'), music('a'), music('b')]);

    await act(async () => result.current.handleSelect('playlist-1'));

    const [, sentMusics] = apiMocks.addMusicsToPlaylist.mock.calls.at(-1) ?? [];
    expect(sentMusics).toHaveLength(2);
  });

  it('저장이 실패하면 errorMsg를 세팅하고 onSaved를 부르지 않는다', async () => {
    apiMocks.addMusicsToPlaylist.mockRejectedValue(new Error('boom'));
    const onSaved = vi.fn();
    const { result } = renderPicker(MUSICS, onSaved);

    await act(async () => result.current.handleSelect('playlist-1'));

    expect(result.current.errorMsg).not.toBeNull();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('새 플레이리스트를 만들고 그 id로 저장한다', async () => {
    const onSaved = vi.fn();
    const { result } = renderPicker(MUSICS, onSaved);

    await act(async () => result.current.handleCreateAndSave());

    expect(apiMocks.createNewPlaylist).toHaveBeenCalled();
    expect(apiMocks.addMusicsToPlaylist).toHaveBeenCalledWith('new-playlist', expect.anything());
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('플레이리스트 생성이 실패하면 errorMsg를 세팅하고 저장을 시도하지 않는다', async () => {
    apiMocks.createNewPlaylist.mockRejectedValue(new Error('boom'));
    const { result } = renderPicker();

    await act(async () => result.current.handleCreateAndSave());

    expect(result.current.errorMsg).not.toBeNull();
    expect(apiMocks.addMusicsToPlaylist).not.toHaveBeenCalled();
  });

  it('목록 조회가 실패하면 errorMsg를 세팅한다', async () => {
    apiMocks.getAllPlaylists.mockRejectedValue(new Error('boom'));
    const { result } = renderPicker();

    await waitFor(() => expect(result.current.errorMsg).not.toBeNull());
  });
});
