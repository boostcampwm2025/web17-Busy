'use client';

import type { GetCommentsResDto } from '@repo/dto';
import { LoadingSpinner } from '@/components';
import { DEFAULT_IMAGES } from '@/constants';
import { coalesceImageSrc, formatRelativeTime } from '@/utils';

type CommentItem = GetCommentsResDto['comments'][number];

type Props = {
  profileImg: string;
  nickname: string;
  createdAtText: string;
  content: string;
  comments: CommentItem[];
  commentsLoading: boolean;
};

export default function PostDetailBody({ profileImg, nickname, createdAtText, content, comments, commentsLoading }: Props) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
      <div className="flex space-x-3">
        <img src={profileImg} alt={nickname} className="w-9 h-9 rounded-full border border-primary/20 object-cover shrink-0" />
        <div className="text-sm min-w-0">
          <p className="font-bold text-primary mb-1">{nickname}</p>
          <p className="text-primary/80 leading-relaxed font-medium whitespace-pre-wrap">{content}</p>
          <span className="text-[10px] text-gray-400 font-bold block mt-2">{createdAtText}</span>
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      <div className="space-y-6">
        {commentsLoading ? (
          <LoadingSpinner />
        ) : comments.length > 0 ? (
          comments.map((c) => (
            <div key={c.id} className="flex space-x-3">
              <img
                src={coalesceImageSrc(c.author.profileImgUrl, DEFAULT_IMAGES.PROFILE)}
                alt={c.author.nickname}
                className="w-9 h-9 rounded-full border border-primary/10 object-cover shrink-0"
              />
              <div className="flex-1 text-sm min-w-0">
                <p className="font-bold text-primary mb-1 inline-block mr-2">{c.author.nickname}</p>
                <span className="text-[10px] text-gray-400 font-bold">{formatRelativeTime(c.createdAt)}</span>
                <div className="mt-2">
                  <p className="text-primary/70 font-medium whitespace-pre-wrap wrap-break-word">{c.content}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400 font-bold">아직 댓글이 없습니다.</p>
            <p className="text-xs text-gray-300">첫 번째 댓글을 남겨보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
