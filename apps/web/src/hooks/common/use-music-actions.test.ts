import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicResponseDto as Music } from '@repo/dto';

import { MODAL_TYPES, useModalStore } from '@/stores/useModalStore';

const mocks = vi.hoisted(() => ({
  createMusic: vi.fn(),
  enqueueLog: vi.fn(),
}));

vi.mock('@/api/internal/music', () => ({ createMusic: mocks.createMusic }));
vi.mock('@/utils/logQueue', () => ({ enqueueLog: mocks.enqueueLog }));

import useMusicActions from './useMusicActions';

const DB_UUID = '019be163-4b37-76ad-aeb3-6986a3489de6';
const EXTERNAL_ID = 'itunes-12345';

const music = (id: string): Music =>
  ({
    id,
    title: '노래',
    artistName: '가수',
    albumCoverUrl: 'https://example.com/cover.png',
    durationMs: 1000,
    provider: 'youtube',
    trackUri: 'youtube:1',
  }) as unknown as Music;

const eventTypeOf = (call: unknown[]) => (call[0] as { eventType: string }).eventType;
const musicIdsOf = (call: unknown[]) => (call[0] as { meta: { musicIds: string[] } }).meta.musicIds;

describe('useMusicActions logging', () => {
  beforeEach(() => {
    mocks.createMusic.mockReset();
    mocks.enqueueLog.mockReset();
    useModalStore.getState().closeModal();
  });

  it('logs a post-add event when opening the write modal', async () => {
    const { result } = renderHook(() => useMusicActions());

    await result.current.openWriteModalWithMusic(music(DB_UUID));

    expect(mocks.enqueueLog).toHaveBeenCalledTimes(1);
    expect(eventTypeOf(mocks.enqueueLog.mock.calls[0]!)).toBe('POST_ADD_MUSICS');
    expect(useModalStore.getState().modalType).toBe(MODAL_TYPES.WRITE);
  });

  it('logs an archive-add event when opening the playlist picker', async () => {
    const { result } = renderHook(() => useMusicActions());

    await result.current.addMusicToArchive(music(DB_UUID));

    expect(eventTypeOf(mocks.enqueueLog.mock.calls[0]!)).toBe('ARCHIVE_ADD_MUSICS');
    expect(useModalStore.getState().modalType).toBe(MODAL_TYPES.PLAYLIST_PICKER);
  });

  /**
   * 외부 검색 결과는 upsert로 id가 DB UUID로 바뀐다.
   * 로그에는 사용자가 실제로 고른 원본 id가 남아야 해서 upsert 전에 기록한다.
   */
  it('logs the id the user picked, not the id assigned by the upsert', async () => {
    mocks.createMusic.mockResolvedValue(music(DB_UUID));
    const { result } = renderHook(() => useMusicActions());

    await result.current.addMusicToArchive(music(EXTERNAL_ID));

    expect(musicIdsOf(mocks.enqueueLog.mock.calls[0]!)).toEqual([EXTERNAL_ID]);
    expect(mocks.createMusic).toHaveBeenCalled();
  });

  it('logs every queued track id for queue-wide actions', async () => {
    const { result } = renderHook(() => useMusicActions());
    const queue = [music(DB_UUID), music('019be163-4b3a-7619-a3cd-75302c5451e6')];

    await result.current.addQueueToArchive(queue);

    expect(musicIdsOf(mocks.enqueueLog.mock.calls[0]!)).toEqual(queue.map((track) => track.id));
  });
});
