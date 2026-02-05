'use client';

import { Heart, Send } from 'lucide-react';
import { toast } from 'react-toastify';

type Props = {
  isAuthenticated: boolean;
  isSubmitting: boolean;
  isLiked: boolean;
  likeCount: number;
  postId: string;
  onToggleLike: () => Promise<void> | void;
  onOpenLikedUsers: () => void;
};

export default function PostDetailActions({ isAuthenticated, isSubmitting, isLiked, likeCount, postId, onToggleLike, onOpenLikedUsers }: Props) {
  const handleCopyLink = async (postId: string) => {
    const link = `${window.location.origin}/post/${postId}`;

    try {
      await navigator.clipboard.writeText(link);
      toast.success('링크가 복사되었습니다!'); // 사용자 피드백
    } catch (err) {
      console.error('링크 복사 실패:', err);
      toast.error('링크 복사에 실패했습니다.');
    }
  };

  return (
    <div className="p-4 border-t-2 border-primary/10 bg-gray-4/30 shrink-0">
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike();
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

        <button onClick={() => handleCopyLink(postId)} className="font-black text-sm text-primary hover:underline">
          <Send />
        </button>
      </div>
    </div>
  );
}
