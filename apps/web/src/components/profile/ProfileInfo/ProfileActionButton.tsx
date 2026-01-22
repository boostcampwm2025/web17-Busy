'use client';

import { addFollow, removeFollow } from '@/api';
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';

const SmallSpinner = () => <div className="h-5 w-5 mx-2.5 my-0.5 animate-spin rounded-full border-2 border-gray-300 border-t-black" />;

interface ProfileActionButtonProps {
  loggedInUserId: string | null;
  profileUserId: string;
  isFollowing: boolean;
  renderIn: 'page' | 'modal';
  onFollowActionComplete: () => void; // 팔로우 상태 업데이트 함수
}

export default function ProfileActionButton({
  loggedInUserId,
  profileUserId,
  isFollowing,
  renderIn = 'page',
  onFollowActionComplete,
}: ProfileActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isLoggedIn = !!loggedInUserId;
  const isMyProfile = loggedInUserId === profileUserId;

  const BUTTON_TEXT = isFollowing ? '팔로잉' : '팔로우';

  /** 팔로우 액션 처리 핸들러 (서버 요청 -> 상태 업데이트) */
  const handleFollowAction = useCallback(async () => {
    setIsLoading(true);
    try {
      isFollowing ? await removeFollow(profileUserId) : await addFollow(profileUserId);
      onFollowActionComplete();
    } catch {
      toast.error(`요청 처리에 실패했습니다.`);
    } finally {
      setIsLoading(false);
    }
  }, [profileUserId, isFollowing, onFollowActionComplete]);

  // 내 프로필이면 -> 프로필 페이지에서는 리캡 생성 버튼, 모달에서는 버튼 필요 x
  if (isMyProfile) {
    return renderIn === 'modal' ? null : (
      <button
        title="프로필 리캡 생성"
        className="px-6 py-2 rounded-full bg-accent-yellow/90 border-2 border-primary text-primary font-bold hover:bg-accent-yellow hover:shadow-[2px_2px_0px_0px_#00214D] transition-all"
      >
        Recap
      </button>
    );
  }

  // isFollowing === true -> [팔로잉] 버튼, 누르면 팔로우 취소 요청
  if (isFollowing) {
    return (
      <button
        onClick={handleFollowAction}
        title="팔로우 취소"
        disabled={!isLoggedIn || isLoading}
        className={`${
          renderIn === 'page' ? 'px-6 py-2 rounded-full' : 'px-4 py-1.5 rounded-lg text-sm'
        } flex items-center justify-center bg-transparent border-gray-2 text-gray-1 border-2 font-bold hover:bg-gray-4 transition-colors disabled:bg-primary/30 disabled:border-primary/50`}
      >
        {isLoading ? <SmallSpinner /> : BUTTON_TEXT}
      </button>
    );
  }

  // isFollowing === false -> [팔로우] 버튼, 누르면 팔로우 요청
  return (
    <button
      onClick={handleFollowAction}
      title="팔로우"
      disabled={!isLoggedIn || isLoading}
      className={`${
        renderIn === 'page' ? 'px-6 py-2 rounded-full' : 'px-4 py-1.5 rounded-lg text-sm'
      } flex items-center justify-center bg-primary/90 text-white border-2 border-primary font-bold hover:bg-primary transition-colors disabled:bg-primary/30 disabled:border-primary/50`}
    >
      {isLoading ? <SmallSpinner /> : BUTTON_TEXT}
    </button>
  );
}
