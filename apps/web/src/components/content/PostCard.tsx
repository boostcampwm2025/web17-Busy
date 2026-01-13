'use client';

import type { Post, Music } from '@/types';
import { Heart, MessageCircle, MoreHorizontal, PlayCircle } from 'lucide-react';
import { useMemo } from 'react';

interface PostCardProps {
  post: Post;
  isPlaying?: boolean;
  onPlay: (music: Music) => void;
  onUserClick: (userId: string) => void;
  onOpenDetail: (post: Post) => void;
}

const MS = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
} as const;

const formatRelativeTime = (iso: string): string => {
  const createdAt = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - createdAt);

  if (diff < MS.minute) return '방금 전';
  if (diff < MS.hour) return `${Math.floor(diff / MS.minute)}분 전`;
  if (diff < MS.day) return `${Math.floor(diff / MS.hour)}시간 전`;
  return `${Math.floor(diff / MS.day)}일 전`;
};

const firstMusic = (post: Post): Music | null => post.musics[0] ?? null;

export default function PostCard({ post, isPlaying = false, onPlay, onUserClick, onOpenDetail }: PostCardProps) {
  const music = useMemo(() => firstMusic(post), [post]);
  const createdAtText = useMemo(() => formatRelativeTime(post.createdAt), [post.createdAt]);

  const isMulti = post.musics.length > 1;

  const handleOpenDetail = () => {
    onOpenDetail(post);
  };

  const handleUserClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onUserClick(post.author.userId);
  };

  const handlePlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!music) return;
    onPlay(music);
  };

  const handleMoreClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  return (
    <article
      onClick={handleOpenDetail}
      className="bg-white border-2 border-primary rounded-2xl p-6 mb-8 shadow-[6px_6px_0px_0px_#00214D]
                 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#00EBC7] transition-all duration-300 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 cursor-pointer group min-w-0" onClick={handleUserClick}>
          <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-gray-100 shrink-0 group-hover:ring-2 ring-accent-cyan transition-all">
            <img src={post.author.profileImageUrl} alt={post.author.nickname} className="w-full h-full object-cover" />
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-lg leading-none truncate group-hover:text-accent-pink transition-colors">{post.author.nickname}</h3>
            <span className="text-xs text-gray-500 font-medium">{createdAtText}</span>
          </div>
        </div>

        <button type="button" onClick={handleMoreClick} className="text-gray-400 hover:text-primary" title="더보기">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Cover */}
      <div className="relative group w-full aspect-square md:aspect-video rounded-xl overflow-hidden border-2 border-primary mb-4 bg-gray-100">
        {/* 다곡 스택 효과(레이어 2장) */}
        {isMulti ? (
          <>
            <div className="absolute inset-0 bg-gray-4 border-2 border-primary rounded-xl translate-x-1 translate-y-1" />
            <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-xl translate-x-2 translate-y-2" />
          </>
        ) : null}

        <img
          src={post.coverImgUrl}
          alt={music ? music.title : 'cover'}
          className="relative z-10 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Play Overlay */}
        <div className="absolute inset-0 z-20 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <button
            type="button"
            onClick={handlePlayClick}
            className="transform scale-90 group-hover:scale-110 transition-transform duration-200"
            title="재생"
          >
            <PlayCircle className={`w-20 h-20 fill-current drop-shadow-lg ${isPlaying ? 'text-accent-cyan' : 'text-white'}`} />
            <span className="sr-only">Play</span>
          </button>
        </div>

        {/* Multi badge */}
        {isMulti ? (
          <div className="absolute top-3 right-3 z-30 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border-2 border-primary text-xs font-black">
            {post.musics.length}곡
          </div>
        ) : null}

        {/* Floating song info */}
        {music ? (
          <div className="absolute bottom-4 left-4 z-30 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-primary shadow-[4px_4px_0px_0px_#FDE24F]">
            <p className="font-black text-primary">{music.title}</p>
            <p className="text-xs font-bold text-gray-600">{music.artistName}</p>
          </div>
        ) : null}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-6 mb-4">
        <button type="button" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 group" title="좋아요">
          <Heart className="w-7 h-7 text-primary group-hover:text-accent-pink group-hover:fill-accent-pink transition-colors" />
          <span className="font-bold text-sm group-hover:text-accent-pink">{post.likeCount}</span>
        </button>

        <button type="button" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 group" title="댓글">
          <MessageCircle className="w-7 h-7 text-primary group-hover:text-accent-cyan transition-colors" />
          <span className="font-bold text-sm group-hover:text-accent-cyan">{post.commentCount}</span>
        </button>
      </div>

      {/* Content */}
      <div className="text-primary">
        <p className="text-base font-medium leading-relaxed line-clamp-3">{post.content}</p>
        <button type="button" onClick={(e) => e.stopPropagation()} className="text-gray-400 text-sm font-bold mt-2 hover:text-primary">
          더보기...
        </button>
      </div>
    </article>
  );
}
