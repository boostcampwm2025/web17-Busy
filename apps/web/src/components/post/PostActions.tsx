'use client';

import { Heart, MessageCircle } from 'lucide-react';
import type { Post } from '@/types';

type Props = {
  post: Post;
  onClickLike?: () => void;
  onClickComment?: () => void;
};

export default function PostActions({ post, onClickLike, onClickComment }: Props) {
  const stop = (e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation();

  return (
    <div className="flex items-center gap-6 mb-4">
      <button type="button" onClick={(e) => (stop(e), onClickLike?.())} className="flex items-center gap-1 group" title="좋아요">
        <Heart className="w-7 h-7 text-primary group-hover:text-accent-pink group-hover:fill-accent-pink transition-colors" />
        <span className="font-bold text-sm group-hover:text-accent-pink">{post.likeCount}</span>
      </button>

      <button type="button" onClick={(e) => (stop(e), onClickComment?.())} className="flex items-center gap-1 group" title="댓글">
        <MessageCircle className="w-7 h-7 text-primary group-hover:text-accent-cyan transition-colors" />
        <span className="font-bold text-sm group-hover:text-accent-cyan">{post.commentCount}</span>
      </button>
    </div>
  );
}
