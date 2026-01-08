'use client';

import { MODAL_TYPES, useModalStore, usePlayerStore } from '@/stores';
import { Music } from '@/types';

export default function useMusicActions() {
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const openModal = useModalStore((s) => s.openModal);

  /**
   * 음악 정보 DB 저장 함수 -> 필요한가?
   * DB 저장해야 하는 시점
   * 1. 컨텐츠 등록 시 (백엔드에서 처리)
   * 2. 보관함 저장 시 (백엔드에서 처리)
   * 3. 음악 재생 시?
   */
  const saveMusicMetadata = (track: Music) => {};

  /** 현재 플레이리스트에 음악 저장 함수 (검색 결과의 음악 재생 버튼, 피드 게시물 클릭 시 사용) */
  const addMusicToPlayer = (track: Music) => addToQueue(track);

  /** 음악으로 컨텐츠 작성 모달 오픈 함수 */
  const openWriteModalWithMusic = (track: Music) => openModal(MODAL_TYPES.WRITE, { initialMusic: track });

  /** TODO: 보관함에 음악 저장 함수 */
  const addMusicToArchive = (track: Music, playlistId: string) => {};

  return {
    addMusicToPlayer,
    openWriteModalWithMusic,
  };
}
