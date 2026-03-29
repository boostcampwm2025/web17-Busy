'use client';

import { useEffect, useRef } from 'react';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import {
  ContentWriteModal,
  PostCardDetailModal,
  LoginModal,
  MobilePlayerModal,
  UserListModal,
  PlaylistDetailModal,
  PlaylistPickerModal,
  PrivacyConsentModal,
} from './index';
import { getFollowerUsers, getFollowingUsers } from '@/api';

export default function ModalContainer() {
  const { isOpen, modalType, modalProps, closeModal } = useModalStore();
  const closeModalRef = useRef(closeModal);
  closeModalRef.current = closeModal;

  // 모달 열릴 때 히스토리 항목 추가 → 뒤로가기로 닫기 지원
  useEffect(() => {
    if (isOpen) {
      history.pushState({ vibrModal: modalType }, '');
    }
  }, [isOpen, modalType]);

  useEffect(() => {
    const onPopState = () => {
      if (useModalStore.getState().isOpen) closeModalRef.current();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useModalStore.getState().isOpen) closeModalRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* 1. 컨텐츠 작성 모달 */}
      {modalType === MODAL_TYPES.WRITE && <ContentWriteModal initialMusic={modalProps.initialMusic} initialMusics={modalProps.initialMusics} />}

      {/* 2. 로그인 모달 */}
      {modalType === MODAL_TYPES.LOGIN && <LoginModal />}

      {/* 3. 포스트 상세 모달 */}
      {modalType === MODAL_TYPES.POST_DETAIL && <PostCardDetailModal />}

      {/* 4. 모바일 재생목록 모달 */}
      {modalType === MODAL_TYPES.MOBILE_QUEUE && <MobilePlayerModal />}

      {/* 5. 팔로워 사용자 목록 모달 */}
      {modalType === MODAL_TYPES.FOLLOWER_USER && <UserListModal title="팔로워 목록" fetchFn={getFollowerUsers} />}

      {/* 6. 팔로잉 사용자 목록 모달 */}
      {modalType === MODAL_TYPES.FOLLOWING_USER && <UserListModal title="팔로잉 목록" fetchFn={getFollowingUsers} />}

      {/* 7. 플레이리스트 상세 모달 */}
      {modalType === MODAL_TYPES.PLAYLIST_DETAIL && <PlaylistDetailModal playlistId={modalProps.playlistId} />}

      {/* 8. 보관함 저장(플레이리스트 선택) 모달 */}
      {modalType === MODAL_TYPES.PLAYLIST_PICKER && <PlaylistPickerModal />}

      {/* 9. 개인정보수집동의 모달 */}
      {modalType === MODAL_TYPES.PRIVACY_CONCENT && <PrivacyConsentModal />}
    </>
  );
}
