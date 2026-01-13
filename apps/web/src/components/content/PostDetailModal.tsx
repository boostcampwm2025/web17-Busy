'use client';

import { useMemo, useState } from 'react';
import { X, Heart, MessageCircle, Share2, MoreHorizontal, PlayCircle, Bookmark } from 'lucide-react';
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
  onClose: () => void;
  onPlay: (music: Music) => void;
}

const buildMockComments = (post: Post): CommentItem[] => {
  // UI 확인용 최소 목업(댓글 API 붙이면 props로 교체)
  return [
    {
      commentId: `${post.postId}-c1`,
      author: {
        nickname: '테스터1',
        profileImageUrl: 'https://picsum.photos/seed/comment-1/100/100',
      },
      content: '이 노래 도입부 너무 좋네요.',
      createdAtText: '5분 전',
    },
    {
      commentId: `${post.postId}-c2`,
      author: {
        nickname: '테스터2',
        profileImageUrl: 'https://picsum.photos/seed/comment-2/100/100',
      },
      content: '플리에 바로 저장했습니다!',
      createdAtText: '2분 전',
    },
  ];
};

export default function PostDetailModal({ post, isOpen, onClose, onPlay, isPlaying = false }: PostDetailModalProps) {
  useScrollLock(isOpen);
  const [commentText, setCommentText] = useState('');

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

  const mainMusic = safePost.musics[0] ?? null;
  const createdAtText = useMemo(() => formatRelativeTime(safePost.createdAt), [safePost.createdAt]);

  const comments = useMemo(() => buildMockComments(safePost), [safePost.postId]);
  if (!isOpen || !post) return null;
  const handleClose = () => {
    onClose();
  };

  const handleBackdropClick = () => {
    onClose();
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handlePlayClick = () => {
    if (!mainMusic) return;
    onPlay(mainMusic);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommentText(e.target.value);
  };

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
        {/* Left Section: Album Cover (Large) */}
        <div className="flex-1 bg-gray-4 flex items-center justify-center relative group overflow-hidden">
          <img src={post.coverImgUrl} alt="cover" className="w-full h-full object-cover" />

          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <button type="button" onClick={handlePlayClick} className="transform scale-100 hover:scale-110 transition-all" title="재생">
              <PlayCircle className={`w-24 h-24 fill-current drop-shadow-xl ${isPlaying ? 'text-accent-cyan' : 'text-white'}`} />
            </button>
          </div>

          {mainMusic ? (
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-xl border-2 border-primary shadow-[6px_6px_0px_0px_#FDE24F]">
              <p className="font-black text-xl text-primary">{mainMusic.title}</p>
              <p className="font-bold text-gray-600">{mainMusic.artistName}</p>
            </div>
          ) : null}
        </div>

        {/* Right Section: Interactions */}
        <div className="w-full md:w-105 flex flex-col bg-white border-l-2 border-primary">
          {/* 1. Header: Author Info */}
          <div className="p-4 border-b-2 border-primary/10 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <img src={post.author.profileImageUrl} alt={post.author.nickname} className="w-9 h-9 rounded-full border border-primary object-cover" />
              <span className="font-bold text-primary truncate">{post.author.nickname}</span>
              <span className="text-xs text-accent-pink font-black shrink-0">• 팔로우</span>
            </div>
            <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer hover:text-primary" />
          </div>

          {/* 2. Content & Comments List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            {/* Post Content */}
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

            {/* Comments */}
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

          {/* 3. Actions & Stats */}
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

          {/* 4. Input Field */}
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
