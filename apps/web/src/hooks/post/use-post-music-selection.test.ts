import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MusicResponseDto as Music } from '@repo/dto';

const musicActionMocks = vi.hoisted(() => ({ ensureMusicInDb: vi.fn() }));
vi.mock('@/hooks/common/use-music-actions', () => ({
  default: () => ({ ensureMusicInDb: musicActionMocks.ensureMusicInDb }),
}));

import { usePostMusicSelection } from './use-post-music-selection';

const buildMusic = (id: string): Music => ({
  id,
  trackUri: `uri:${id}`,
  provider: 'itunes' as Music['provider'],
  albumCoverUrl: `https://example.com/${id}.jpg`,
  title: `track-${id}`,
  artistName: `artist-${id}`,
  durationMs: 1000,
});

const idsOf = (musics: Music[]) => musics.map((m) => m.id);

describe('usePostMusicSelection', () => {
  beforeEach(() => {
    musicActionMocks.ensureMusicInDb.mockReset().mockImplementation(async (m: Music) => m);
  });

  it('dedupes the initial musics', () => {
    const { result } = renderHook(() => usePostMusicSelection({ initialMusics: [buildMusic('a'), buildMusic('a'), buildMusic('b')] }));

    expect(idsOf(result.current.selectedMusics)).toEqual(['a', 'b']);
  });

  /**
   * 검색 결과 id는 외부 trackId일 수 있어 DB 저장 후 UUID로 바뀐다.
   * 저장 전 id로 중복을 판정하면 같은 곡이 두 번 담긴다.
   */
  it('dedupes by the id returned from the database, not the searched id', async () => {
    musicActionMocks.ensureMusicInDb.mockResolvedValue({ ...buildMusic('db-uuid') });
    const { result } = renderHook(() => usePostMusicSelection({ initialMusics: [buildMusic('db-uuid')] }));

    await act(async () => {
      await result.current.addMusic(buildMusic('itunes-123'));
    });

    expect(idsOf(result.current.selectedMusics)).toEqual(['db-uuid']);
  });

  it('appends a music that is not selected yet', async () => {
    const { result } = renderHook(() => usePostMusicSelection({}));

    await act(async () => {
      await result.current.addMusic(buildMusic('a'));
    });

    expect(idsOf(result.current.selectedMusics)).toEqual(['a']);
  });

  it('adds only the playlist musics that are not already selected', () => {
    const { result } = renderHook(() => usePostMusicSelection({ initialMusics: [buildMusic('a')] }));

    act(() => result.current.addMusics([buildMusic('a'), buildMusic('b')]));

    expect(idsOf(result.current.selectedMusics)).toEqual(['a', 'b']);
  });

  it('keeps the same array when a playlist adds nothing new', () => {
    const { result } = renderHook(() => usePostMusicSelection({ initialMusics: [buildMusic('a')] }));
    const before = result.current.selectedMusics;

    act(() => result.current.addMusics([buildMusic('a')]));

    expect(result.current.selectedMusics).toBe(before);
  });

  it('removes by id', () => {
    const { result } = renderHook(() => usePostMusicSelection({ initialMusics: [buildMusic('a'), buildMusic('b')] }));

    act(() => result.current.removeMusic('a'));

    expect(idsOf(result.current.selectedMusics)).toEqual(['b']);
  });

  it('moves a music within the list', () => {
    const { result } = renderHook(() => usePostMusicSelection({ initialMusics: [buildMusic('a'), buildMusic('b'), buildMusic('c')] }));

    act(() => result.current.moveMusic(2, 'up'));

    expect(idsOf(result.current.selectedMusics)).toEqual(['a', 'c', 'b']);
  });

  it('restores the initial musics on reset', () => {
    const { result } = renderHook(() => usePostMusicSelection({ initialMusics: [buildMusic('a')] }));
    act(() => result.current.removeMusic('a'));

    act(() => result.current.reset());

    expect(idsOf(result.current.selectedMusics)).toEqual(['a']);
  });
});
