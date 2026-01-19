'use client';

import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { ContentWriteModal, PostCardDetailModal, LoginModal, MobilePlayerModal } from './index';

export default function ModalContainer() {
  const { isOpen, modalType, modalProps } = useModalStore();

  if (!isOpen) return null;

  return (
    <>
      {modalType === MODAL_TYPES.WRITE && <ContentWriteModal initialMusic={modalProps.initialMusic} />}

      {/* 2. 로그인 모달 */}
      {modalType === MODAL_TYPES.LOGIN && <LoginModal />}

      {/* 3. 포스트 상세 모달 */}
      {modalType === MODAL_TYPES.POST_DETAIL && <PostCardDetailModal />}

      {/* 4. 모바일 재생목록 모달 */}
      {modalType === MODAL_TYPES.MOBILE_QUEUE && <MobilePlayerModal />}
    </>
  );

  return null;
}
