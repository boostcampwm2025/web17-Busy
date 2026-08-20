'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import type { SearchUsersResDto } from '@repo/dto';

import { useProfileFollowMutation } from '@/hooks';
import { coalesceImageSrc } from '@/utils';
import { DEFAULT_IMAGES } from '@/constants';

type SearchUser = SearchUsersResDto['users'][number];

type Props = {
  user: SearchUser;
  disabledFollow: boolean;

  /** 현재 로그인 사용자 id. 팔로우 mutation의 viewer이자 내 계정 판별에 쓴다. */
  meId: string | null;
};

export default function UserItem({ user, disabledFollow, meId }: Props) {
  const router = useRouter();
  const { mutate: follow, isPending: isSubmitting } = useProfileFollowMutation();

  const isMe = user.id === meId;

  const handleGoProfile = () => {
    router.push(`/profile/${user.id}`);
  };

  /** 팔로우 결과는 mutation이 query cache에 반영하므로 목록이 자동으로 갱신된다. */
  const handleToggleFollow = () => {
    if (isMe) return;
    if (disabledFollow) return;
    if (isSubmitting) return;

    follow(
      { targetUserId: user.id, viewerUserId: meId, wasFollowing: user.isFollowing },
      { onError: () => toast.error('요청 처리에 실패했습니다.') },
    );
  };

  const containerClassName = isMe
    ? 'w-full flex items-center p-3 rounded-xl'
    : 'w-full flex items-center p-3 rounded-xl hover:bg-gray-4 transition-colors';

  return (
    <div className={containerClassName}>
      <button
        type="button"
        onClick={handleGoProfile}
        // disabled={isMe}
        className={`w-12 h-12 mr-4 shrink-0 ${isMe ? 'cursor-default' : ''}`}
        title={isMe ? '내 프로필' : '프로필 보기'}
      >
        <img
          src={coalesceImageSrc(user.profileImgUrl, DEFAULT_IMAGES.PROFILE)}
          alt={user.nickname}
          className="w-12 h-12 rounded-full object-cover border border-gray-3"
        />
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-primary truncate">{user.nickname}</p>
      </div>

      {isMe ? (
        <button
          type="button"
          disabled
          className="px-3 py-2 text-xs font-bold rounded-lg border border-gray-3 bg-white text-gray-2 cursor-not-allowed"
        >
          ME
        </button>
      ) : (
        <button
          type="button"
          onClick={handleToggleFollow}
          disabled={disabledFollow || isSubmitting}
          aria-busy={isSubmitting}
          className={
            user.isFollowing
              ? 'px-3 py-2 text-xs font-bold rounded-lg border border-gray-3 bg-white text-gray-2 disabled:opacity-50 disabled:cursor-not-allowed'
              : 'px-3 py-2 text-xs font-bold rounded-lg border border-primary bg-primary text-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed'
          }
        >
          {isSubmitting ? '처리 중…' : user.isFollowing ? '팔로우 중' : '팔로우'}
        </button>
      )}
    </div>
  );
}
