'use client';

import { CloseButton } from '@/components/common/CloseButton';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ModalShell } from '@/components/common/ModalShell';
import ProfileActionButton from '@/components/profile/ProfileInfo/ProfileActionButton';
import { DEFAULT_IMAGES } from '@/constants/defaultImages';
import { useModalStore } from '@/stores/useModalStore';
import { useAuthMe } from '@/hooks/auth/client/use-auth-me';
import { useRouter } from 'next/navigation';
import { type MouseEvent } from 'react';
import { useFollowUsersQuery, type FollowListType } from '@/hooks/profile/use-follow-users-query';

interface UserListModalProps {
  title: string;
  listType: FollowListType;
  profileUserId: string;
}

export const UserListModal = ({ title, listType, profileUserId }: UserListModalProps) => {
  const closeModal = useModalStore((s) => s.closeModal);

  const router = useRouter();
  const { userId: loggedInUserId } = useAuthMe();

  const { items, hasNext, isInitialLoading, errorMsg, ref } = useFollowUsersQuery(listType, profileUserId);

  /** 프로필 클릭 시 해당 프로필 페이지 내비게이션 함수 */
  const handleProfileClick = (profileUserId: string) => {
    closeModal();
    router.push(`/profile/${profileUserId}`);
  };

  const handleCloseModal = () => {
    closeModal();
  };

  const handleProfileButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    const targetUserId = event.currentTarget.dataset.userId;
    if (!targetUserId) return;

    handleProfileClick(targetUserId);
  };

  return (
    <ModalShell onClose={handleCloseModal} size="sm" cardClassName="h-[50vh]">
      {/* 모달 헤더 영역 */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white">
        <h2 className="text-xl font-black text-primary">{title}</h2>
        <CloseButton onClose={handleCloseModal} />
      </div>

      {/* 사용자 목록 */}
      {isInitialLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex-1 overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
              <p className="font-bold text-sm">사용자가 없습니다.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {items.map((user, idx) => {
                return (
                  <li key={user.id + idx} className="flex items-center justify-between p-3 hover:bg-grayish rounded-xl transition-colors group">
                    <div className="flex items-center flex-1 min-w-0 mr-4">
                      <button data-user-id={user.id} onClick={handleProfileButtonClick} className="relative shrink-0 w-10 h-10">
                        <img
                          src={user.profileImgUrl || DEFAULT_IMAGES.PROFILE}
                          alt={user.nickname}
                          loading="lazy"
                          className="w-full h-full rounded-full border border-primary object-cover"
                        />
                      </button>
                      <p className="ml-3 min-w-0 font-bold text-md text-primary truncate">{user.nickname}</p>
                    </div>

                    {/* 사용자별 액션 버튼 */}
                    {/* 팔로우 결과는 mutation이 query cache에 반영하므로 목록이 자동으로 갱신된다. */}
                    <ProfileActionButton loggedInUserId={loggedInUserId} profileUserId={user.id} isFollowing={user.isFollowing} renderIn="modal" />
                  </li>
                );
              })}
            </ul>
          )}
          {/** 무한 스크롤 처리 영역 */}
          {errorMsg && (
            <div className="text-center">
              <p>{errorMsg}</p>
              <p className="text-sm mt-2">다시 시도해주세요.</p>
            </div>
          )}
          {hasNext && (
            <div ref={ref}>
              <LoadingSpinner hStyle="py-6" />
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
};
