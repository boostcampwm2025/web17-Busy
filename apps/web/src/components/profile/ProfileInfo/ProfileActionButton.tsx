import { addFollow, removeFollow } from '@/api';
import { useCallback } from 'react';

interface ProfileActionButtonProps {
  loggedInUserId: string | null;
  profileUserId: string;
  isFollowing: boolean;
  renderIn: 'page' | 'modal';
  onActionComplete: () => void;
}

export default function ProfileActionButton({
  loggedInUserId,
  profileUserId,
  isFollowing,
  renderIn = 'page',
  onActionComplete,
}: ProfileActionButtonProps) {
  const isLoggedIn = !!loggedInUserId;
  const isMyProfile = loggedInUserId === profileUserId;

  const BUTTON_TEXT = isFollowing ? '팔로잉' : '팔로우';

  const handleAddFollow = useCallback(async () => {
    await addFollow(profileUserId);
    onActionComplete();
  }, [profileUserId, onActionComplete]);

  const handleRemoveFollow = useCallback(async () => {
    await removeFollow(profileUserId);
    onActionComplete();
  }, [profileUserId, onActionComplete]);

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
        onClick={handleRemoveFollow}
        title="팔로우 취소"
        disabled={!isLoggedIn}
        className={`${renderIn === 'page' ? 'px-6 py-2 rounded-full' : 'px-4 py-1.5 rounded-lg text-sm'} bg-transparent border-gray-3 text-gray-1 border-2 font-bold hover:bg-gray-4 transition-colors disabled:bg-primary/30 disabled:border-primary/50`}
      >
        {BUTTON_TEXT}
      </button>
    );
  }

  // isFollowing === false -> [팔로우] 버튼, 누르면 팔로우 요청
  return (
    <button
      onClick={handleAddFollow}
      title="팔로우"
      disabled={!isLoggedIn}
      className={`${renderIn === 'page' ? 'px-6 py-2 rounded-full' : 'px-4 py-1.5 rounded-lg text-sm'} bg-primary/90 text-white border-2 border-primary font-bold hover:bg-primary transition-colors disabled:bg-primary/30 disabled:border-primary/50`}
    >
      {BUTTON_TEXT}
    </button>
  );
}
