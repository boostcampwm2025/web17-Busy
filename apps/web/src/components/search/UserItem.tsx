'use client';

import { useRouter } from 'next/navigation';
import type { SearchUsersResDto } from '@repo/dto';
import { addFollow } from '@/api';
import { coalesceImageSrc } from '@/utils';
import { DEFAULT_IMAGES } from '@/constants';

type SearchUser = SearchUsersResDto['users'][number];

type Props = {
  user: SearchUser;
  disabledFollow: boolean;
  onFollowed: (userId: string) => void;
};

export default function UserItem({ user, disabledFollow, onFollowed }: Props) {
  const router = useRouter();

  const handleGoProfile = () => {
    router.push(`/profile/${user.id}`);
  };

  const handleFollow = async () => {
    if (disabledFollow) return;
    if (user.isFollowing) return;

    try {
      await addFollow(user.id);
      onFollowed(user.id);
    } catch {
      // TODO(BE): 팔로우 API 연동 완료 후 에러 UX(토스트/메시지) 확정
    }
  };

  return (
    <div className="w-full flex items-center p-3 rounded-xl hover:bg-gray-4 transition-colors">
      <button type="button" onClick={handleGoProfile} className="w-12 h-12 mr-4 shrink-0">
        <img
          src={coalesceImageSrc(user.profileImgUrl, DEFAULT_IMAGES.PROFILE)}
          alt={user.nickname}
          className="w-12 h-12 rounded-full object-cover border border-gray-3"
        />
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-primary truncate">{user.nickname}</p>
      </div>

      {user.isFollowing ? (
        <button
          type="button"
          disabled
          className="px-3 py-2 text-xs font-bold rounded-lg border border-gray-3 bg-white text-gray-2 disabled:cursor-not-allowed"
        >
          팔로우 중
        </button>
      ) : (
        <button
          type="button"
          onClick={handleFollow}
          disabled={disabledFollow}
          className="px-3 py-2 text-xs font-bold rounded-lg border border-primary bg-primary text-white
                     hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          팔로우
        </button>
      )}
    </div>
  );
}
