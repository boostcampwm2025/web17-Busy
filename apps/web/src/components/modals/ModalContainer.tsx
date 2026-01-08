'use client';

import { useModalStore, MODAL_TYPES } from '@/stores';
import { ContentWriteModal } from './ContentWriteModal';

export default function ModalContainer() {
  const { modalType, isOpen } = useModalStore();

  if (!isOpen) return null;

  return (
    <>
      {/* 1. 글쓰기 모달 */}
      {modalType === MODAL_TYPES.WRITE && <ContentWriteModal />}
    </>
  );
}
