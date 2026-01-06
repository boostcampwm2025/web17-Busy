'use client';

import { useModalStore, MODAL_TYPES } from '@components/stores/useModalStore';
import { ContentWriteModal } from '@components/modals/ContentWriteModal';

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
