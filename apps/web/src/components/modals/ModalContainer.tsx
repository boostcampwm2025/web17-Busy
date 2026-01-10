'use client';

import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { ContentWriteModal } from '@/components/modals/ContentWriteModal';
import { LoginModal } from './LoginModal/LoginModal';

export default function ModalContainer() {
  const { modalType, isOpen, modalProps } = useModalStore();

  if (!isOpen) return null;

  return (
    <>
      {/* 1. 글쓰기 모달 */}
      {modalType === MODAL_TYPES.WRITE && <ContentWriteModal initialMusic={modalProps.initialMusic} />}
      {modalType === MODAL_TYPES.LOGIN && <LoginModal />}
    </>
  );
}
