'use client';

import { Heart } from 'lucide-react';

type Props = {
  isAuthenticated: boolean;
  isSubmitting: boolean;
  isLiked: boolean;
  likeCount: number;
  onToggleLike: () => Promise<void> | void;
  onOpenLikedUsers: () => void;
};

export default function PostDetailActions({ isAuthenticated, isSubmitting, isLiked, likeCount, onToggleLike, onOpenLikedUsers }: Props) {
  return (
    <div className="p-4 border-t-2 border-primary/10 bg-gray-4/30">
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void onToggleLike();
          }}
          disabled={!isAuthenticated || isSubmitting}
          title={isAuthenticated ? '좋아요' : '로그인 후 사용 가능'}
          className="disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Heart
            className={[
              'w-7 h-7 transition-colors',
              isLiked ? 'text-accent-pink fill-accent-pink' : 'text-primary hover:text-accent-pink hover:fill-accent-pink',
            ].join(' ')}
          />
        </button>

        <button type="button" onClick={onOpenLikedUsers} className="font-black text-sm text-primary hover:underline" title="좋아요한 사용자 보기">
          좋아요 {likeCount}개
        </button>
      </div>
    </div>
  );
}
