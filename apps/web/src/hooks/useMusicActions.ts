'use client';

import { MODAL_TYPES, useModalStore, usePlayerStore } from '@/stores';
import { Music } from '@/types';

export default function useMusicActions() {
  const playMusic = usePlayerStore((s) => s.playMusic);
  const openModal = useModalStore((s) => s.openModal);

  /** 현재 플레이리스트에 음악 저장 함수 (검색 결과의 음악 재생 버튼, 피드 게시물 클릭 시 사용) */
  const addMusicToPlayer = (track: Music) => playMusic(track);

  /** 음악으로 컨텐츠 작성 모달 오픈 함수 */
  const openWriteModalWithMusic = (track: Music) => openModal(MODAL_TYPES.WRITE, { initialMusic: track });

  /** TODO: 보관함에 음악 저장 함수 */
  const addMusicToArchive = (track: Music, playlistId: string) => {};

  return {
    addMusicToPlayer,
    openWriteModalWithMusic,
  };
}
