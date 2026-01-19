'use client';

import { useMemo, useState, useEffect } from 'react';
import { Heart, MoreHorizontal } from 'lucide-react';

import { useModalStore, MODAL_TYPES, usePlayerStore } from '@/stores';
import { useScrollLock, usePostDetail } from '@/hooks';
import { formatRelativeTime, coalesceImageSrc } from '@/utils';
import { buildMockComments, EMPTY_POST, DEFAULT_IMAGES } from '@/constants';
import { PostMedia, LoadingSpinner } from '@/components';
import { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

export const PostCardDetailModal = () => {
  const { isOpen, modalType, modalProps, closeModal } = useModalStore();

  const enabled = isOpen && modalType === MODAL_TYPES.POST_DETAIL;
  useScrollLock(enabled);

  const playMusic = usePlayerStore((s) => s.playMusic);
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.id ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const [commentText, setCommentText] = useState('');

  // postId를 단일 진실로 사용
  const postId = enabled ? (modalProps?.postId as string | undefined) : undefined;
  const passedPost = enabled ? ((modalProps?.post as Post | undefined) ?? undefined) : undefined;

  // postId 없으면 모달을 안전하게 닫기
  useEffect(() => {
    if (!enabled) return;
    if (!postId) closeModal();
  }, [enabled, postId, closeModal]);

  // post 로딩(있으면 즉시, 없으면 fetch)
  const { post, isLoading, error } = usePostDetail({
    enabled,
    postId,
    passedPost,
  });

  // hook order 안정화용 safePost
  const safePost = post ?? EMPTY_POST;

  const createdAtText = useMemo(() => formatRelativeTime(safePost.createdAt), [safePost.createdAt]);
  const comments = useMemo(() => buildMockComments(safePost), [safePost.id]);

  if (!enabled) return null;
  if (!postId) return null;

  const handleBackdropClick = () => closeModal();

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handlePlay = (music: Music) => {
    playMusic(music);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommentText(e.target.value);
  };

  const handleToggleLike = () => {
    // TODO(#next): 좋아요 API 연동
    // - POST /like
    // - DELETE /like/:postId
    // - Optimistic UI 여부 결정
  };

  const handleSubmitComment = () => {
    // TODO(#next): 댓글 API 연동
  };

  //const profileImg = safePost.author.profileImgUrl ?? DEFAULT_IMAGES.PROFILE;
  //const profileImg = safePost.author.profileImgUrl?.trim() || DEFAULT_IMAGES.PROFILE;
  const profileImg = coalesceImageSrc(safePost.author.profileImgUrl, DEFAULT_IMAGES.PROFILE);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-2xl border-2 border-primary shadow-2xl flex flex-col md:flex-row overflow-hidden animate-scale-up"
        onClick={handleModalClick}
      >
        {/* Left */}
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="flex-1 flex items-center justify-center bg-gray-4">
            <div className="text-sm font-bold text-gray-500">{error}</div>
          </div>
        ) : post ? (
          <PostMedia post={safePost} variant="modal" currentMusicId={currentMusicId} isPlayingGlobal={isPlaying} onPlay={handlePlay} />
        ) : (
          <LoadingSpinner />
        )}

        {/* Right */}
        <div className="w-full md:w-105 flex flex-col bg-white border-l-2 border-primary">
          {/* Header */}
          <div className="p-4 border-b-2 border-primary/10 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <img src={profileImg} alt={safePost.author.nickname} className="w-9 h-9 rounded-full border border-primary object-cover" />
              <span className="font-bold text-primary truncate">{safePost.author.nickname}</span>
              <span className="text-xs text-accent-pink font-black shrink-0">• 팔로우</span>
            </div>
            <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer hover:text-primary" />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            <div className="flex space-x-3">
              <img src={profileImg} alt={safePost.author.nickname} className="w-9 h-9 rounded-full border border-primary/20 object-cover shrink-0" />
              <div className="text-sm min-w-0">
                <p className="font-bold text-primary mb-1">{safePost.author.nickname}</p>
                <p className="text-primary/80 leading-relaxed font-medium whitespace-pre-wrap">{safePost.content}</p>
                <span className="text-[10px] text-gray-400 font-bold block mt-2">{createdAtText}</span>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="space-y-6">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.commentId} className="flex space-x-3 group">
                    <img
                      //src={c.author.profileImgUrl ?? DEFAULT_IMAGES.PROFILE}
                      src={coalesceImageSrc(c.author.profileImgUrl, DEFAULT_IMAGES.PROFILE)}
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLike();
                  }}
                  title="좋아요"
                >
                  <Heart className="w-7 h-7 text-primary hover:text-accent-pink hover:fill-accent-pink cursor-pointer transition-colors" />
                </button>
                <p className="font-black text-sm text-primary mb-1">좋아요 {safePost.likeCount}개</p>
              </div>
            </div>
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
};
