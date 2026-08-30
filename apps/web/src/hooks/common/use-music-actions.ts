'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';

import { MODAL_TYPES, useModalStore } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import type { CreateMusicReqDto, MusicResponseDto as Music } from '@repo/dto';
import { createMusic } from '@/api/internal/music';
import { makeArchiveAddMusicLog, makePostAddMusicLog } from '@/api/internal/logging';
import { enqueueLog } from '@/utils/logQueue';

const isUuid = (v: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const toCreateMusicReqDto = (m: Music): CreateMusicReqDto => ({
  trackUri: m.trackUri,
  provider: m.provider,
  albumCoverUrl: m.albumCoverUrl,
  title: m.title,
  artistName: m.artistName,
  durationMs: m.durationMs,
});

/** DB upsert로 id가 바뀌기 전에 남긴다. 사용자가 실제로 고른 트랙 id가 기록돼야 한다. */
const logMusicIds = (tracks: Music[], make: typeof makePostAddMusicLog) => {
  enqueueLog(make({ musicIds: tracks.map((track) => track.id) }));
};

/**
 * 아래 액션들은 전부 클릭 핸들러에서 await 없이 호출된다.
 * upsert가 실패했을 때 거절을 그대로 흘리면 unhandled rejection이 되고 사용자는 아무 반응도 못 본다.
 */
const runSafely = async (action: () => Promise<void>) => {
  try {
    await action();
  } catch (err) {
    console.error('음악 처리 실패:', err);
    toast.error('음악을 불러오지 못했습니다.');
  }
};

/**
 * NOTE:
 * - 검색(iTunes) 결과는 id가 외부 trackId일 수 있음
 * - 서버에서 upsert 후 반환된 DB UUID를 받아 플레이어/모달에서 사용
 */
const ensureMusicInDb = async (track: Music): Promise<Music> => {
  // 이미 DB UUID면 그대로 사용
  if (track.id && isUuid(track.id)) return track;

  // 외부 id면 DB에 upsert 후 DB UUID로 교체
  const saved = await createMusic(toCreateMusicReqDto(track));
  return saved;
};

const ensureMusicsInDb = async (tracks: Music[]): Promise<Music[]> => {
  // 중복(동일 id) 최소화 + 순서 유지
  const seen = new Set<string>();
  const unique = tracks.filter((t) => {
    const key = t.id ?? `${t.provider}:${t.trackUri}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const ensured = await Promise.all(unique.map(ensureMusicInDb));
  return ensured;
};

/**
 * 반환값은 리렌더를 거쳐도 같은 참조를 유지한다.
 * 소비처의 useCallback과 memo() 리프(NowPlayingMetaActions)가 이 참조를 deps로 쓴다.
 */
export default function useMusicActions() {
  const playMusic = usePlayerStore((s) => s.playMusic);
  const openModal = useModalStore((s) => s.openModal);

  /** 재생: DB에 보장 후 플레이어에 전달 */
  const addMusicToPlayer = useCallback(
    (track: Music) =>
      runSafely(async () => {
        const ensured = await ensureMusicInDb(track);
        playMusic(ensured);
      }),
    [playMusic],
  );

  /** 작성 모달(단일): DB에 보장 후 initialMusics로 전달 */
  const openWriteModalWithMusic = useCallback(
    (track: Music) =>
      runSafely(async () => {
        logMusicIds([track], makePostAddMusicLog);

        const [ensured] = await ensureMusicsInDb([track]);
        if (!ensured) return;
        openModal(MODAL_TYPES.WRITE, { initialMusics: [ensured] });
      }),
    [openModal],
  );

  /** 보관함 저장(단일): music DB에 보장 후 플레이리스트 선택 모달 오픈 */
  const addMusicToArchive = useCallback(
    (track: Music) =>
      runSafely(async () => {
        logMusicIds([track], makeArchiveAddMusicLog);

        const [ensured] = await ensureMusicsInDb([track]);
        if (!ensured) return;
        openModal(MODAL_TYPES.PLAYLIST_PICKER, { musics: [ensured] });
      }),
    [openModal],
  );

  /** 작성 모달(큐 전체) */
  const openWriteModalWithQueue = useCallback(
    (tracks: Music[]) =>
      runSafely(async () => {
        logMusicIds(tracks, makePostAddMusicLog);

        const ensured = await ensureMusicsInDb(tracks);
        if (ensured.length === 0) return;
        openModal(MODAL_TYPES.WRITE, { initialMusics: ensured });
      }),
    [openModal],
  );

  /** 보관함 저장(큐 전체) */
  const addQueueToArchive = useCallback(
    (tracks: Music[]) =>
      runSafely(async () => {
        logMusicIds(tracks, makeArchiveAddMusicLog);

        const ensured = await ensureMusicsInDb(tracks);
        if (ensured.length === 0) return;
        openModal(MODAL_TYPES.PLAYLIST_PICKER, { musics: ensured });
      }),
    [openModal],
  );

  return useMemo(
    () => ({
      ensureMusicInDb,
      addMusicToPlayer,
      openWriteModalWithMusic,
      addMusicToArchive,
      openWriteModalWithQueue,
      addQueueToArchive,
    }),
    [addMusicToPlayer, openWriteModalWithMusic, addMusicToArchive, openWriteModalWithQueue, addQueueToArchive],
  );
}
