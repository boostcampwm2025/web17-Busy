'use client';

import { MODAL_TYPES, useModalStore } from '@/stores';
import { Music } from '@/types';

export default function useMusicActions() {
  const openModal = useModalStore((s) => s.openModal);

  /** 음악 정보 저장 함수 -> 필요한가? */
  const saveMusicMetadata = (track: Music) => {};

  /** 음악 재생 함수 -> 전역 플레이어 로직 재사용 */
  const playMusic = (track: Music) => {
    // TODO: player hook에서 재생 함수 호출?
  };

  /** 음악으로 컨텐츠 작성 모달 오픈 함수 */
  const openWriteModalWithMusic = (track: Music) => openModal(MODAL_TYPES.WRITE, { initialMusic: track });

  /** TODO: 음악 보관함 저장 함수 */
  const addMusic2Archive = (track: Music) => {};

  return {
    openWriteModalWithMusic,
  };
}
