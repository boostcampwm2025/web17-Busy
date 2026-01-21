'use client';

import ProfileActionButton from '@/components/profile/ProfileInfo/ProfileActionButton';
import { DEFAULT_IMAGES } from '@/constants';
import { useInfiniteScroll } from '@/hooks';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { useModalStore } from '@/stores';
import { GetUserFollowDto } from '@repo/dto';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface UserListModalProps {
  title: string;
  fetchFn: (userId: string, cursor?: string | undefined, limit?: number) => Promise<GetUserFollowDto>;
}

export const UserListModal = ({ title, fetchFn }: UserListModalProps) => {
  const { modalProps, closeModal } = useModalStore();
  const { profileUserId }: { profileUserId: string } = modalProps;

  const router = useRouter();
  const { userId: loggedInUserId } = useAuthMe();

  /** fetch 함수 반환 형식을 무한 스크롤 hook 시그니처에 맞게 변환하는 함수 */
  const fetchUsers = useCallback(
    async (cursor?: string, limit?: number) => {
      const data = await fetchFn(profileUserId, cursor, limit);
      return { items: data.users, hasNext: data.hasNext, nextCursor: data.nextCursor };
    },
    [profileUserId],
  );

  const handleProfileClick = (profileUserId: string) => {
    closeModal();
    router.push(`/profile/${profileUserId}`);
  };

  //const { items, hasNext, error, ref } = useInfiniteScroll({ fetchFn: fetchUsers });

  const users = [
    { id: '1', nickname: '테스트1', profileImgUrl: '', isFollowing: true },
    { id: '2', nickname: '테스트2', profileImgUrl: '', isFollowing: false },
    { id: '3', nickname: '테스트3', profileImgUrl: '', isFollowing: false },
    { id: '4', nickname: '테스트4', profileImgUrl: '', isFollowing: true },
    { id: '5', nickname: '테스트5', profileImgUrl: '', isFollowing: true },
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={closeModal}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl border-2 border-primary flex flex-col max-h-[60vh] overflow-hidden animate-scale-up z-10">
        {/* 모달 헤더 영역 */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white">
          <h2 className="text-xl font-black text-primary">{title}</h2>
          <button onClick={closeModal} className="p-1 hover:bg-grayish rounded-full transition-colors">
            <X className="w-6 h-6 text-primary" />
          </button>
        </div>

        {/* 사용자 목록 */}
        <div className="flex-1 overflow-y-auto p-2">
          {users.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
              <p className="font-bold text-sm">사용자가 없습니다.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {users.map((user) => {
                return (
                  <li key={user.id} className="flex items-center justify-between p-3 hover:bg-grayish rounded-xl transition-colors group">
                    <div className="flex items-center flex-1 min-w-0 mr-4">
                      <button onClick={() => handleProfileClick(user.id)} className="relative shrink-0 w-10 h-10">
                        <img
                          src={user.profileImgUrl || DEFAULT_IMAGES.PROFILE}
                          alt={user.nickname}
                          className="w-full h-full rounded-full border border-primary object-cover"
                        />
                      </button>
                      <p className="ml-3 min-w-0 font-bold text-md text-primary truncate">{user.nickname}</p>
                    </div>

                    {/* 사용자별 액션 버튼 */}
                    <ProfileActionButton
                      isLoggedIn={!!loggedInUserId}
                      isMyProfile={user.id === loggedInUserId}
                      isFollowing={user.isFollowing}
                      renderIn="modal"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
