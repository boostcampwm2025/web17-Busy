'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { coalesceImageSrc, formatRelativeTime } from '@/utils';
import type { PostResponseDto } from '@repo/dto';
import { DEFAULT_IMAGES } from '@/constants';
import { deletePost } from '@/api/internal/post';
import { toast } from 'react-toastify';
import { showConfirmToast } from '@/components/ConfirmToast';

type Props = {
  post: PostResponseDto;
  isOwner: boolean;
  onUserClick: (userId: string) => void;
  onEditPost?: () => void;
  onDeletePost?: () => void;
};

export default function PostHeader({ post, isOwner, onUserClick, onEditPost, onDeletePost }: Props) {
  const createdAtText = formatRelativeTime(post.createdAt);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleUser = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onUserClick(post.author.id);
  };

  const handleMoreMenuToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  };

  const handleEditPost = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onEditPost && onEditPost();
    setIsMenuOpen(false);
  };

  const handleDeletePost = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    showConfirmToast('정말로 삭제하시겠습니까?', async () => {
      try {
        await deletePost(post.id);
        toast.success('삭제했습니다.');
        // TODO: 피드 상태 업데이트
        onDeletePost && onDeletePost();
      } catch (error) {
        toast.error('삭제 실패');
      }
    });
  };

  const profileImg = coalesceImageSrc(post.author.profileImgUrl, DEFAULT_IMAGES.PROFILE);

  return (
    <div className="flex items-center justify-between my-2">
      <div className="flex items-center gap-3 cursor-pointer group min-w-0" onClick={handleUser}>
        <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-gray-100 shrink-0 group-hover:ring-2 ring-accent-cyan transition-all">
          <img src={profileImg} alt={post.author.nickname} className="w-full h-full object-cover" />
        </div>

        <div className="min-w-0">
          <h3 className="font-bold lg:text-lg leading-none truncate group-hover:text-accent-pink transition-colors">{post.author.nickname}</h3>
          <span className="text-xs text-gray-500 font-medium">{createdAtText}</span>
        </div>
      </div>

      {isOwner && (
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={handleMoreMenuToggle}
            className={`text-gray-400 p-2 hover:text-primary transition-colors ${isMenuOpen ? 'text-primary' : ''}`}
            title="더보기"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>
          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute top-full right-0 mt-2 bg-white border border-primary rounded-lg overflow-hidden min-w-24 z-30 animate-in fade-in zoom-in duration-200"
            >
              <button
                onClick={handleEditPost}
                className="block w-full px-4 py-2.5 text-sm text-blue-500 font-bold border-b border-gray-3 hover:bg-blue-50 transition-colors text-left"
              >
                수정하기
              </button>
              <button
                onClick={handleDeletePost}
                className="block w-full px-4 py-2.5 text-sm text-red-500 font-bold hover:bg-red-50 transition-colors text-left"
              >
                삭제하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
