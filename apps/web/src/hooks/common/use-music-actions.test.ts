import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicResponseDto as Music } from '@repo/dto';

import { MODAL_TYPES, useModalStore } from '@/stores/useModalStore';

const mocks = vi.hoisted(() => ({
  createMusic: vi.fn(),
  enqueueLog: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/internal/music', () => ({ createMusic: mocks.createMusic }));
vi.mock('@/utils/logQueue', () => ({ enqueueLog: mocks.enqueueLog }));
vi.mock('react-toastify', () => ({ toast: mocks.toast }));

import useMusicActions from './use-music-actions';

type MusicActions = ReturnType<typeof useMusicActions>;

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

/**
 * 이 액션들은 전부 클릭 핸들러에서 await 없이 호출된다.
 * upsert가 실패해도 거절하면 안 되고(unhandled rejection), 사용자에게 알려야 한다.
 */
describe('useMusicActions failure handling', () => {
  beforeEach(() => {
    mocks.createMusic.mockReset();
    mocks.enqueueLog.mockReset();
    mocks.toast.error.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useModalStore.getState().closeModal();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['addMusicToPlayer', (r: MusicActions) => r.addMusicToPlayer(music(EXTERNAL_ID))],
    ['openWriteModalWithMusic', (r: MusicActions) => r.openWriteModalWithMusic(music(EXTERNAL_ID))],
    ['addMusicToArchive', (r: MusicActions) => r.addMusicToArchive(music(EXTERNAL_ID))],
    ['openWriteModalWithQueue', (r: MusicActions) => r.openWriteModalWithQueue([music(EXTERNAL_ID)])],
    ['addQueueToArchive', (r: MusicActions) => r.addQueueToArchive([music(EXTERNAL_ID)])],
  ])('%s does not reject when the upsert fails', async (_name, run) => {
    mocks.createMusic.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useMusicActions());

    await expect(run(result.current)).resolves.toBeUndefined();
    expect(mocks.toast.error).toHaveBeenCalledTimes(1);
  });

  it('does not open a modal when the upsert fails', async () => {
    mocks.createMusic.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useMusicActions());

    await result.current.openWriteModalWithMusic(music(EXTERNAL_ID));

    expect(useModalStore.getState().modalType).toBeNull();
  });

  /** 이 원시 함수는 반환값을 쓰는 호출부(usePostMusicSelection)가 있어 계속 던져야 한다. */
  it('keeps ensureMusicInDb rejecting so callers can react to the failure', async () => {
    mocks.createMusic.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useMusicActions());

    await expect(result.current.ensureMusicInDb(music(EXTERNAL_ID))).rejects.toThrow('network down');
  });
});

/**
 * 소비처(useCurrentMusicActions·QueueToolbar·TrackItem·usePostMusicSelection)의 useCallback deps에
 * 이 반환값이 그대로 들어간다. 매 렌더 새 참조를 주면 그 아래 memo() 리프까지 전부 무효화된다.
 */
describe('useMusicActions reference stability', () => {
  it('returns the same object across re-renders', () => {
    const { result, rerender } = renderHook(() => useMusicActions());
    const first = result.current;

    rerender();

    // 객체가 같으면 액션 6개도 전부 같다. 하나라도 새로 만들어지면 useMemo deps가 바뀌어 여기서 걸린다
    expect(result.current).toBe(first);
  });
});
