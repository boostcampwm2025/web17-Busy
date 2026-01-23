'use client';

import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import {
  ContentWriteModal,
  PostCardDetailModal,
  LoginModal,
  MobilePlayerModal,
  UserListModal,
  PlaylistDetailModal,
  PlaylistPickerModal,
} from './index';
import { getFollowerUsers, getFollowingUsers } from '@/api';

export default function ModalContainer() {
  const { isOpen, modalType, modalProps } = useModalStore();

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
    </>
  );
}
