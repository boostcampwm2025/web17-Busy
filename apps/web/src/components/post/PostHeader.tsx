'use client';

import { MoreHorizontal } from 'lucide-react';
import { useRelativeTime } from '@/hooks';
import { PostResponseDto } from '@repo/dto';

type Props = {
  post: PostResponseDto;
  onUserClick: (userId: string) => void;
  onMoreClick?: () => void;
};

export default function PostHeader({ post, onUserClick, onMoreClick }: Props) {
  const createdAtText = useRelativeTime(post.createdAt);

  const handleUser = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onUserClick(post.author.id);
  };

  const handleMore = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onMoreClick?.();
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3 cursor-pointer group min-w-0" onClick={handleUser}>
        <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-gray-100 shrink-0 group-hover:ring-2 ring-accent-cyan transition-all">
          <img src={post.author.profileImgUrl} alt={post.author.nickname} className="w-full h-full object-cover" />
        </div>

        <div className="min-w-0">
          <h3 className="font-bold text-lg leading-none truncate group-hover:text-accent-pink transition-colors">{post.author.nickname}</h3>
          <span className="text-xs text-gray-500 font-medium">{createdAtText}</span>
        </div>
      </div>

      <button type="button" onClick={handleMore} className="text-gray-400 hover:text-primary" title="더보기">
        <MoreHorizontal className="w-6 h-6" />
      </button>
    </div>
  );
}
