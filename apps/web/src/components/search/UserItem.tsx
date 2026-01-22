'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SearchUsersResDto } from '@repo/dto';

import { addFollow, removeFollow } from '@/api';
import { coalesceImageSrc } from '@/utils';
import { DEFAULT_IMAGES } from '@/constants';

type SearchUser = SearchUsersResDto['users'][number];

type Props = {
  user: SearchUser;
  disabledFollow: boolean;

  /** 상위 상태 동기화(Optimistic UI 포함) */
  onFollowChange: (userId: string, next: boolean) => void;
};

export default function UserItem({ user, disabledFollow, onFollowChange }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoProfile = () => {
    router.push(`/profile/${user.id}`);
  };

  const handleToggleFollow = async () => {
    if (disabledFollow) return;
    if (isSubmitting) return;

    const next = !user.isFollowing;

    // Optimistic: 먼저 UI 반영(스크롤/재렌더에도 유지되도록 상위 상태 갱신)
    onFollowChange(user.id, next);

    setIsSubmitting(true);

    try {
      if (next) await addFollow(user.id);
      else await removeFollow(user.id);
    } catch {
      // 실패 시 원복
      onFollowChange(user.id, !next);
      // TODO(BE): 토스트/메시지 UX 확정
    } finally {
      setIsSubmitting(false);
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
    </div>
  );
}
