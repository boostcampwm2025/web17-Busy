'use client';

import type { PostResponseDto } from '@repo/dto';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { toast } from 'react-toastify';

type Props = {
  post: PostResponseDto;
  onClickLike?: () => void;
  onClickComment?: () => void;

  /** 비로그인/요청 중 등 비활성화 */
  disabledLike?: boolean;
};

export default function PostActions({ post, onClickLike, onClickComment, disabledLike = false }: Props) {
  const stop = (e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation();
  const liked = Boolean(post.isLiked);

  const heartClassName = [
    'w-5 h-5 sm:w-7 sm:h-7 transition-colors',
    liked ? 'text-accent-pink fill-accent-pink' : 'text-primary group-hover:text-accent-pink group-hover:fill-accent-pink',
  ].join(' ');

  const likeCountClassName = [
    'font-bold text-xs sm:text-sm transition-colors',
    liked ? 'text-accent-pink' : 'text-primary group-hover:text-accent-pink',
  ].join(' ');

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
    <div className="flex items-center gap-6 mb-4">
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          onClickLike?.();
        }}
        disabled={disabledLike}
        className="flex items-center gap-1 group disabled:opacity-40 disabled:cursor-not-allowed"
        title={disabledLike ? '로그인 후 사용 가능' : '좋아요'}
      >
        <Heart className={heartClassName} />
        <span className={likeCountClassName}>{post.likeCount}</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          stop(e);
          onClickComment?.();
        }}
        className="flex items-center gap-1 group"
        title="댓글"
      >
        <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7 text-primary group-hover:text-accent-cyan transition-colors" />
        <span className="font-bold text-xs sm:text-sm text-primary group-hover:text-accent-cyan transition-colors">{post.commentCount}</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          stop(e);
          handleCopyLink(post.id);
        }}
        className="group"
        title="링크 복사"
      >
        <Send className="w-5 h-5 sm:w-7 sm:h-7 text-primary group-hover:text-accent-cyan transition-colors" />
      </button>
    </div>
  );
}
