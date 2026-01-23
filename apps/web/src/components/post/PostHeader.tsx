'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useRelativeTime } from '@/hooks';
import type { PostResponseDto } from '@repo/dto';
import { DEFAULT_IMAGES } from '@/constants';
import { coalesceImageSrc } from '@/utils';
import { deletePost } from '@/api/internal/post';
import { toast } from 'react-toastify';
import { showConfirmToast } from '../ConfirmToast';

type Props = {
  post: PostResponseDto;
  isOwner: boolean;
  onUserClick: (userId: string) => void;
  onMoreClick?: () => void;
};

export default function PostHeader({ post, isOwner, onUserClick, onMoreClick }: Props) {
  const createdAtText = useRelativeTime(post.createdAt);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleUser = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onUserClick(post.author.id);
  };

  const handleMore = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onMoreClick) {
      onMoreClick();
      return;
    }
    if (isOwner) {
      setIsMenuOpen((prev) => !prev);
    }
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    showConfirmToast('정말로 삭제하시겠습니까?', async () => {
      try {
        await deletePost(post.id);
        toast.success('삭제했습니다.');
      } catch (error) {
        toast.error('삭제 실패');
      }
    });
  };

  const profileImg = coalesceImageSrc(post.author.profileImgUrl, DEFAULT_IMAGES.PROFILE);

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3 cursor-pointer group min-w-0" onClick={handleUser}>
        <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-gray-100 shrink-0 group-hover:ring-2 ring-accent-cyan transition-all">
          <img src={profileImg} alt={post.author.nickname} className="w-full h-full object-cover" />
        </div>

        <div className="min-w-0">
          <h3 className="font-bold text-lg leading-none truncate group-hover:text-accent-pink transition-colors">{post.author.nickname}</h3>
          <span className="text-xs text-gray-500 font-medium">{createdAtText}</span>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={handleMore}
          className={`text-gray-400 hover:text-primary transition-colors ${isMenuOpen ? 'text-primary' : ''}`}
          title="더보기"
        >
          <MoreHorizontal className="w-6 h-6" />
        </button>
        {isMenuOpen && isOwner && (
          <div className="absolute top-full right-0 mt-2 bg-white border-2 border-primary rounded-lg shadow-[3px_3px_0px_0px_#00214D] overflow-hidden min-w-[100px] z-30 animate-in fade-in zoom-in duration-200">
            <button
              onClick={handleDelete}
              className="block w-full px-4 py-2 text-sm text-red-500 font-bold hover:bg-red-50 transition-colors text-left"
            >
              삭제하기
            </button>
          </div>
        )}
      </div>
      {isMenuOpen && <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />}
    </div>
  );
}
