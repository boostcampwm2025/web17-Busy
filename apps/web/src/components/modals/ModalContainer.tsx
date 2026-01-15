'use client';

import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { ContentWriteModal } from '@/components/modals/ContentWriteModal';
import { LoginModal } from './LoginModal/LoginModal';
import { PostDetailModal } from '../content';

export default function ModalContainer() {
  const { modalType, isOpen, modalProps } = useModalStore();

  if (!isOpen) return null;

  return (
    <>
      {modalType === MODAL_TYPES.WRITE && <ContentWriteModal initialMusic={modalProps.initialMusic} />}
      {modalType === MODAL_TYPES.LOGIN && <LoginModal />}
      {/* {modalType === MODAL_TYPES.CONTENT && <PostDetailModal
        isOpen={}
        onClose={}
        onPlay={}
        post={}
        currentMusicId={}
        isPlaying{}
        key={}
      />} */}
    </>
  );
}
