'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import { ProfileActionButton } from '@/components/profile';
import { DEFAULT_IMAGES } from '@/constants';
import type { GetUserFollowDto } from '@repo/dto';
import { useModalStore } from '@/stores/useModalStore';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, type MouseEvent } from 'react';
import { useInfiniteScroll } from '@/hooks';
import { queryKeys } from '@/api';

interface UserListModalProps {
  title: string;
  fetchFn: (userId: string, cursor?: string | undefined, limit?: number) => Promise<GetUserFollowDto>;
}

export const UserListModal = ({ title, fetchFn }: UserListModalProps) => {
  const modalProps = useModalStore((s) => s.modalProps);
  const closeModal = useModalStore((s) => s.closeModal);
  const { profileUserId }: { profileUserId: string } = modalProps;

  const router = useRouter();
  const { userId: loggedInUserId } = useAuthMe();

  /** fetch 함수 반환 형식을 무한 스크롤 hook 시그니처에 맞게 변환하는 함수 */
  const fetchUsers = useCallback(
    async (cursor?: string, limit?: number) => {
      const data = await fetchFn(profileUserId, cursor, limit);
      return { items: data.users, hasNext: data.hasNext, nextCursor: data.nextCursor };
    },
    [profileUserId, fetchFn],
  );

  const { items, hasNext, isInitialLoading, errorMsg, ref } = useInfiniteScroll({
    queryKey: queryKeys.users.list(title, profileUserId),
    fetchFn: fetchUsers,
  });

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
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={handleCloseModal}></div>
      <div className="relative bg-white w-full max-w-sm md:max-w-md rounded-3xl border-2 border-primary flex flex-col h-[50vh] overflow-hidden animate-scale-up z-10">
        {/* 모달 헤더 영역 */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white">
          <h2 className="text-xl font-black text-primary">{title}</h2>
          <button onClick={handleCloseModal} className="p-1 hover:bg-grayish rounded-full transition-colors">
            <X className="w-6 h-6 text-primary" />
          </button>
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
      </div>
    </div>
  );
};
