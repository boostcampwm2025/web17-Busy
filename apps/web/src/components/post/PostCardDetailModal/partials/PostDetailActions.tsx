import { Heart, Send } from 'lucide-react';
import { copyPostLink } from '@/utils/share-post-link';

type Props = {
  isAuthenticated: boolean;
  isSubmitting: boolean;
  isLiked: boolean;
  likeCount: number;
  postId: string;
  onToggleLike: () => void;
  onOpenLikedUsers: () => void;
};

export default function PostDetailActions({ isAuthenticated, isSubmitting, isLiked, likeCount, postId, onToggleLike, onOpenLikedUsers }: Props) {
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

        <button type="button" onClick={() => void copyPostLink(postId)} className="font-black text-sm text-primary hover:underline" title="링크 복사">
          <Send />
        </button>
      </div>
    </div>
  );
}
