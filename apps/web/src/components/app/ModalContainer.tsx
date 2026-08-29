'use client';

import { useEffect, useRef } from 'react';
import { useModalStore, useModalProps, MODAL_TYPES } from '@/stores/useModalStore';
import { LoginModal } from '@/components/auth/LoginModal';
import { ContentWriteModal } from '@/components/post/ContentWriteModal';
import { PostCardDetailModal } from '@/components/post/PostCardDetailModal';
import { PlaylistDetailModal } from '@/components/playlist/PlaylistDetailModal';
import { PlaylistPickerModal } from '@/components/playlist/PlaylistPickerModal';
import { UserListModal } from '@/components/profile/UserListModal';
import { PrivacyConsentModal } from '@/components/setting/PrivacyConsentModal';

export default function ModalContainer() {
  const isOpen = useModalStore((s) => s.isOpen);
  const modalType = useModalStore((s) => s.modalType);
  const writeProps = useModalProps(MODAL_TYPES.WRITE);
  const followerProps = useModalProps(MODAL_TYPES.FOLLOWER_USER);
  const followingProps = useModalProps(MODAL_TYPES.FOLLOWING_USER);
  const playlistDetailProps = useModalProps(MODAL_TYPES.PLAYLIST_DETAIL);
  const playlistPickerProps = useModalProps(MODAL_TYPES.PLAYLIST_PICKER);
  const closeModal = useModalStore((s) => s.closeModal);
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
      {/* 컨텐츠 작성 모달 */}
      {modalType === MODAL_TYPES.WRITE && <ContentWriteModal initialMusics={writeProps?.initialMusics} />}

      {/* 로그인 모달 */}
      {modalType === MODAL_TYPES.LOGIN && <LoginModal />}

      {/* 포스트 상세 모달 */}
      {modalType === MODAL_TYPES.POST_DETAIL && <PostCardDetailModal />}

      {/* 팔로워 사용자 목록 모달 */}
      {modalType === MODAL_TYPES.FOLLOWER_USER && (
        <UserListModal title="팔로워 목록" listType="followers" profileUserId={followerProps?.profileUserId ?? ''} />
      )}

      {/* 팔로잉 사용자 목록 모달 */}
      {modalType === MODAL_TYPES.FOLLOWING_USER && (
        <UserListModal title="팔로잉 목록" listType="followings" profileUserId={followingProps?.profileUserId ?? ''} />
      )}

      {/* 플레이리스트 상세 모달 */}
      {modalType === MODAL_TYPES.PLAYLIST_DETAIL && <PlaylistDetailModal playlistId={playlistDetailProps?.playlistId ?? ''} />}

      {/* 보관함 저장(플레이리스트 선택) 모달 */}
      {modalType === MODAL_TYPES.PLAYLIST_PICKER && <PlaylistPickerModal musics={playlistPickerProps?.musics ?? []} />}

      {/* 개인정보수집동의 모달 */}
      {modalType === MODAL_TYPES.PRIVACY_CONCENT && <PrivacyConsentModal />}
    </>
  );
}
