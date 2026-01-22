'use client';

import { MODAL_TYPES, useModalStore, usePlayerStore } from '@/stores';
import type { CreateMusicReqDto, MusicResponseDto as Music } from '@repo/dto';
import { createMusic } from '@/api/internal/music';

const isUuid = (v: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const toCreateMusicReqDto = (m: Music): CreateMusicReqDto => ({
  trackUri: m.trackUri,
  provider: m.provider,
  albumCoverUrl: m.albumCoverUrl,
  title: m.title,
  artistName: m.artistName,
  durationMs: m.durationMs,
});

const normalizeToArray = (v: Music | Music[]): Music[] => (Array.isArray(v) ? v : [v]);

/**
 * NOTE:
 * - 검색(iTunes) 결과는 id가 외부 trackId일 수 있음
 * - 서버에서 upsert 후 반환된 DB UUID를 받아 플레이어/모달에서 사용
 */
export default function useMusicActions() {
  const playMusic = usePlayerStore((s) => s.playMusic);
  const openModal = useModalStore((s) => s.openModal);

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

  /** 재생: DB에 보장 후 플레이어에 전달 */
  const addMusicToPlayer = async (track: Music) => {
    const ensured = await ensureMusicInDb(track);
    playMusic(ensured);
  };

  /** 작성 모달(단일): DB에 보장 후 initialMusic으로 전달 */
  const openWriteModalWithMusic = async (track: Music) => {
    const [ensured] = await ensureMusicsInDb([track]);
    if (!ensured) return;
    openModal(MODAL_TYPES.WRITE, { initialMusics: [ensured] });
  };

  /** 보관함 저장(단일): music DB에 보장 후 플레이리스트 선택 모달 오픈 */
  const addMusicToArchive = async (track: Music) => {
    const [ensured] = await ensureMusicsInDb([track]);
    if (!ensured) return;
    openModal(MODAL_TYPES.PLAYLIST_PICKER, { musics: [ensured] });
  };

  /** 작성 모달(큐 전체) */
  const openWriteModalWithQueue = async (tracks: Music[]) => {
    const ensured = await ensureMusicsInDb(tracks);
    if (ensured.length === 0) return;
    openModal(MODAL_TYPES.WRITE, { initialMusics: ensured });
  };

  /** 보관함 저장(큐 전체) */
  const addQueueToArchive = async (tracks: Music[]) => {
    const ensured = await ensureMusicsInDb(tracks);
    if (ensured.length === 0) return;
    openModal(MODAL_TYPES.PLAYLIST_PICKER, { musics: ensured });
  };

  return {
    addMusicToPlayer,
    openWriteModalWithMusic,
    addMusicToArchive,
    openWriteModalWithQueue,
    addQueueToArchive,
  };
}
