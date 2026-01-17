'use client';

import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { ContentWriteModal, PostCardDetailModal, LoginModal } from './index';

export default function ModalContainer() {
  const { isOpen, modalType, modalProps, closeModal } = useModalStore();

  if (!isOpen) return null;

  return (
    <>
      {/* 1. 글쓰기 모달 */}
      {modalType === MODAL_TYPES.WRITE && <ContentWriteModal initialMusic={modalProps.initialMusic} />}

      {/* 2. 로그인 모달 */}
      {modalType === MODAL_TYPES.LOGIN && <LoginModal />}

      {/* 3. 포스트 상세 모달 */}
      {modalType === MODAL_TYPES.POST_DETAIL && (
        <PostCardDetailModal isOpen post={modalProps.post ?? null} postId={modalProps.postId} onClose={closeModal} />
      )}
    </>
  );

  return null;
}
