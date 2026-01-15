'use client';

import { useMemo, useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { formatRelativeTime } from '@/utils';
import { Music, Post } from '@/types';

interface PostCardProps {
  post: Post;

  /** 전역 플레이어 상태 */
  currentMusicId: string | null;
  isPlayingGlobal: boolean;

  /** 액션 */
  onPlay: (music: Music) => void;
  onUserClick: (userId: string) => void;
  onOpenDetail: (post: Post) => void;
}

const getMusicAt = (post: Post, index: number): Music | null => post.musics[index] ?? null;

export default function PostCard({ post, currentMusicId, isPlayingGlobal, onPlay, onUserClick, onOpenDetail }: PostCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const createdAtText = useMemo(() => formatRelativeTime(post.createdAt), [post.createdAt]);
  const isMulti = post.musics.length > 1;

  const activeMusic = useMemo(() => getMusicAt(post, activeIndex), [post, activeIndex]);
  const coverUrl = activeMusic?.albumCoverUrl ?? post.coverImgUrl;

  const isActivePlaying = Boolean(activeMusic && isPlayingGlobal && currentMusicId === activeMusic.musicId);

  const handleOpenDetail = () => {
    onOpenDetail(post);
  };

  const handleUserClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onUserClick(post.author.userId);
  };

  const handlePlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!activeMusic) return;
    onPlay(activeMusic);
  };

  const handleMoreClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  const handlePrevSlide = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isMulti) return;

    setActiveIndex((prev) => {
      const next = prev - 1;
      return next < 0 ? post.musics.length - 1 : next;
    });
  };

  const handleNextSlide = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isMulti) return;

    setActiveIndex((prev) => (prev + 1) % post.musics.length);
  };

  return (
    <article
      onClick={handleOpenDetail}
      className="bg-white border-2 border-primary rounded-2xl p-6 mb-8 shadow-[3px_3px_0px_0px_#00214D]
                 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#00EBC7] transition-all duration-300 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 cursor-pointer group min-w-0" onClick={handleUserClick}>
          <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-gray-100 shrink-0 group-hover:ring-2 ring-accent-cyan transition-all">
            <img src={post.author.profileImgUrl} alt={post.author.nickname} className="w-full h-full object-cover" />
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

      {/* Cover + Carousel */}
      <div className="relative group w-full aspect-square md:aspect-video rounded-xl overflow-hidden border-2 border-primary mb-4 bg-gray-100">
        <img
          src={coverUrl}
          alt={activeMusic?.title ?? 'cover'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover overlay: only show controls on hover */}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/35 transition-colors">
          {/* Center Play/Pause */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handlePlayClick}
              className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-[2px_2px_0px_0px_#00ebc7] opacity-0 group-hover:opacity-100 transition-opacity"
              title={isActivePlaying ? '일시정지' : '재생'}
            >
              {isActivePlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
          </div>

          {/* Prev / Next (multi only) */}
          {isMulti ? (
            <>
              <button
                type="button"
                onClick={handlePrevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2
                           w-10 h-10 rounded-full bg-white/80 border border-primary text-primary
                           flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity
                         hover:bg-white"
                title="이전"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={handleNextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           w-10 h-10 rounded-full bg-white/80 border border-primary text-primary
                           flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity
                         hover:bg-white"
                title="다음"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          ) : null}
        </div>

        {/* Multi badge */}
        {isMulti ? (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border-2 border-primary text-xs font-black">
            {post.musics.length}곡
          </div>
        ) : null}

        {/* Floating info (active music 기준) */}
        {activeMusic ? (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-primary shadow-[4px_4px_0px_0px_#FDE24F]">
            <p className="font-black text-primary">{activeMusic.title}</p>
            <p className="text-xs font-bold text-gray-600">{activeMusic.artistName}</p>
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
