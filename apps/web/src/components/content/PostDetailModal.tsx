'use client';

import { useMemo, useState } from 'react';
import { X, Heart, MessageCircle, Share2, MoreHorizontal, Play, Pause, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post, Music } from '@/types';
import { useScrollLock } from '@/hooks';
import { formatRelativeTime } from '@/utils';

type CommentItem = {
  commentId: string;
  author: {
    nickname: string;
    profileImageUrl: string;
  };
  content: string;
  createdAtText: string;
};

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  isPlaying?: boolean;
  currentMusicId?: string | null;
  onClose: () => void;
  onPlay: (music: Music) => void;
}

const buildMockComments = (post: Post): CommentItem[] => [
  {
    commentId: `${post.postId}-c1`,
    author: { nickname: '테스터1', profileImageUrl: 'https://picsum.photos/seed/comment-1/100/100' },
    content: '이 노래 도입부 너무 좋네요.',
    createdAtText: '5분 전',
  },
  {
    commentId: `${post.postId}-c2`,
    author: { nickname: '테스터2', profileImageUrl: 'https://picsum.photos/seed/comment-2/100/100' },
    content: '플리에 바로 저장했습니다!',
    createdAtText: '2분 전',
  },
];

export default function PostDetailModal({ post, isOpen, onClose, onPlay, isPlaying = false, currentMusicId = null }: PostDetailModalProps) {
  useScrollLock(isOpen);

  const [commentText, setCommentText] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const safePost = post ?? {
    postId: 'empty',
    author: { userId: '', nickname: '', profileImageUrl: '' },
    coverImgUrl: '',
    content: '',
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date(0).toISOString(),
    musics: [],
  };

  const isMulti = safePost.musics.length > 1;

  const activeMusic = useMemo(() => safePost.musics[activeIndex] ?? null, [safePost.musics, activeIndex]);
  const coverUrl = activeMusic?.albumCoverUrl ?? safePost.coverImgUrl;
  const createdAtText = useMemo(() => formatRelativeTime(safePost.createdAt), [safePost.createdAt]);
  const comments = useMemo(() => buildMockComments(safePost), [safePost.postId]);

  const isActivePlaying = Boolean(activeMusic && isPlaying && currentMusicId === activeMusic.musicId);

  if (!isOpen || !post) return null;

  const handleClose = () => onClose();

  const handleBackdropClick = () => onClose();

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handlePlayClick = () => {
    if (!activeMusic) return;
    onPlay(activeMusic);
  };

  const handlePrevSlide = () => {
    if (!isMulti) return;
    setActiveIndex((prev) => (prev - 1 < 0 ? safePost.musics.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (!isMulti) return;
    setActiveIndex((prev) => (prev + 1) % safePost.musics.length);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => setCommentText(e.target.value);

  const handleSubmitComment = () => {
    // TODO(#next): 댓글 API 연동 시 구현
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-4 right-6 text-white hover:scale-110 transition-transform z-70"
        title="닫기"
      >
        <X className="w-8 h-8" />
      </button>

      <div
        className="bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-2xl border-2 border-primary shadow-2xl flex flex-col md:flex-row overflow-hidden animate-scale-up"
        onClick={handleModalClick}
      >
        {/* Left: Carousel Cover */}
        <div className="flex-1 bg-gray-4 relative group overflow-hidden">
          <img src={coverUrl} alt={activeMusic?.title ?? 'cover'} className="w-full h-full object-cover" />

          {/* Hover overlay: controls appear only on hover */}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors">
            {/* Center Play/Pause */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <button
                type="button"
                onClick={handlePlayClick}
                className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center
                           shadow-[3px_3px_0px_0px_#00ebc7]
                           pointer-events-auto hover:scale-105 transition-transform"
                title={isActivePlaying ? '일시정지' : '재생'}
              >
                {isActivePlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
              </button>
            </div>

            {/* Prev/Next for multi */}
            {isMulti ? (
              <>
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2
                             w-12 h-12 rounded-full bg-white/80 border border-primary text-primary
                             flex items-center justify-center
                             opacity-0 group-hover:opacity-100 transition-opacity
                             hover:bg-white"
                  title="이전"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>

                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                             w-12 h-12 rounded-full bg-white/80 border border-primary text-primary
                             flex items-center justify-center
                             opacity-0 group-hover:opacity-100 transition-opacity
                             hover:bg-white"
                  title="다음"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            ) : null}
          </div>

          {/* Floating song info (active music) */}
          {activeMusic ? (
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-xl border-2 border-primary shadow-[6px_6px_0px_0px_#FDE24F]">
              <p className="font-black text-xl text-primary">{activeMusic.title}</p>
              <p className="font-bold text-gray-600">{activeMusic.artistName}</p>
            </div>
          ) : null}
        </div>

        {/* Right Section: (기존 그대로) */}
        <div className="w-full md:w-105 flex flex-col bg-white border-l-2 border-primary">
          <div className="p-4 border-b-2 border-primary/10 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <img src={post.author.profileImageUrl} alt={post.author.nickname} className="w-9 h-9 rounded-full border border-primary object-cover" />
              <span className="font-bold text-primary truncate">{post.author.nickname}</span>
              <span className="text-xs text-accent-pink font-black shrink-0">• 팔로우</span>
            </div>
            <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer hover:text-primary" />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            <div className="flex space-x-3">
              <img
                src={post.author.profileImageUrl}
                alt={post.author.nickname}
                className="w-9 h-9 rounded-full border border-primary/20 object-cover shrink-0"
              />
              <div className="text-sm min-w-0">
                <p className="font-bold text-primary mb-1">{post.author.nickname}</p>
                <p className="text-primary/80 leading-relaxed font-medium whitespace-pre-wrap">{post.content}</p>
                <span className="text-[10px] text-gray-400 font-bold block mt-2">{createdAtText}</span>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="space-y-6">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.commentId} className="flex space-x-3 group">
                    <img
                      src={c.author.profileImageUrl}
                      alt={c.author.nickname}
                      className="w-9 h-9 rounded-full border border-primary/10 object-cover shrink-0"
                    />
                    <div className="flex-1 text-sm min-w-0">
                      <p className="font-bold text-primary mb-1 inline-block mr-2">{c.author.nickname}</p>
                      <p className="text-primary/70 inline font-medium">{c.content}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-[10px] text-gray-400 font-bold">{c.createdAtText}</span>
                      </div>
                    </div>
                    <Heart className="w-3.5 h-3.5 text-gray-300 group-hover:text-accent-pink cursor-pointer" />
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

          <div className="p-4 border-t-2 border-primary/10 bg-gray-4/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Heart className="w-7 h-7 text-primary hover:text-accent-pink hover:fill-accent-pink cursor-pointer transition-colors" />
                <MessageCircle className="w-7 h-7 text-primary hover:text-accent-cyan cursor-pointer transition-colors" />
                <Share2 className="w-7 h-7 text-primary hover:text-accent-yellow cursor-pointer transition-colors" />
              </div>
              <Bookmark className="w-7 h-7 text-primary hover:text-accent-cyan cursor-pointer transition-colors" />
            </div>

            <p className="font-black text-sm text-primary mb-1">좋아요 {post.likeCount}개</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{createdAtText}</p>
          </div>

          <div className="p-4 border-t-2 border-primary flex items-center space-x-3 bg-white">
            <input
              type="text"
              placeholder="댓글 달기..."
              value={commentText}
              onChange={handleCommentChange}
              className="flex-1 py-1 text-sm font-medium focus:outline-none bg-background"
            />
            <button
              type="button"
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              className="text-accent-pink font-black text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 transition-transform"
            >
              게시
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
