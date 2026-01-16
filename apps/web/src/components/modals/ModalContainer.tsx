'use client';

import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { LoginModal } from './LoginModal/LoginModal';
import PostCardDetailModal from '@/components/modals/PostCardDetailModal';
import ContentWriteModalAdapter from '@/components/modals/ContentWriteModal/ContentWriteModalAdapter';

export default function ModalContainer() {
  const { isOpen, modalProps, closeModal } = useModalStore();

  if (!isOpen || !modalProps) return null;

  if (modalProps.type === MODAL_TYPES.WRITE) {
    return <ContentWriteModalAdapter initialMusic={modalProps.initialMusic} />;
  }

  if (modalProps.type === MODAL_TYPES.LOGIN) {
    return <LoginModal />;
  }

  if (modalProps.type === MODAL_TYPES.POST_DETAIL) {
    return <PostCardDetailModal isOpen post={modalProps.post ?? null} postId={modalProps.postId} onClose={closeModal} />;
  }

  return null;
}
