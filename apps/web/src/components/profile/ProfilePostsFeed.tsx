'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { getUserProfilePosts, getPostDetail } from '@/api';
import { useInfiniteScroll } from '@/hooks';
import useIsMobile from '@/hooks/useIsMobile';
import { useModalStore, MODAL_TYPES, usePlayerStore } from '@/stores';
import { PostCard } from '@/components';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { PostResponseDto as Post, MusicResponseDto as Music } from '@repo/dto';

interface Props {
  userId: string;
  initialPostId?: string;
}

export default function ProfilePostsFeed({ userId, initialPostId }: Props) {
  const router = useRouter();
  const openModal = useModalStore((s) => s.openModal);
  const playMusic = usePlayerStore((s) => s.playMusic);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const selectMusic = usePlayerStore((s) => s.selectMusic);
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.id ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const isMobile = useIsMobile();
  const isMobileInitializedRef = useRef(false);
  const prevIsMobileRef = useRef(false);
  const didScrollRef = useRef(false);

  // 스와이프 백 제스처
  const pageRef = useRef<HTMLDivElement>(null);
  const swipe = useRef({ startX: 0, startY: 0, isHorizontal: null as boolean | null });

  const fetchFn = useCallback(
    async (cursor?: string) => {
      const { items: previews, hasNext, nextCursor } = await getUserProfilePosts(userId, cursor);
      const fullPosts = await Promise.all(previews.map((p) => getPostDetail(p.postId)));
      return { items: fullPosts, hasNext, nextCursor };
    },
    [userId],
  );

  const { items, hasNext, isInitialLoading, errorMsg, ref } = useInfiniteScroll({ fetchFn });

  // 초기 로드 완료 후 클릭했던 게시글로 스크롤
  useEffect(() => {
    if (isInitialLoading || didScrollRef.current || !initialPostId) return;
    didScrollRef.current = true;
    requestAnimationFrame(() => {
      const el = document.getElementById(`post-${initialPostId}`);
      el?.scrollIntoView({ block: 'start' });
    });
  }, [isInitialLoading, initialPostId]);

  // 화면이 데스크탑 크기로 커지면 프로필 페이지로 돌아가며 모달 열기
  useEffect(() => {
    if (!isMobileInitializedRef.current) {
      isMobileInitializedRef.current = true;
      prevIsMobileRef.current = isMobile;
      return;
    }

    const prev = prevIsMobileRef.current;
    prevIsMobileRef.current = isMobile;

    if (prev && !isMobile && initialPostId) {
      openModal(MODAL_TYPES.POST_DETAIL, { postId: initialPostId });
      router.replace(`/profile/${userId}`);
    }
  }, [isMobile, userId, initialPostId, openModal, router]);

  const handlePlay = (music: Music) => playMusic(music);
  const handlePlayAll = (post: Post) => {
    const musics = post.musics;
    if (!musics.length) return;
    const firstMusic = musics[0];
    if (!firstMusic) return;
    addToQueue(musics);
    selectMusic(firstMusic);
  };
  const handleUserClick = (uid: string) => router.push(`/profile/${uid}`);
  const handleOpenDetail = (post: Post) => openModal(MODAL_TYPES.POST_DETAIL, { postId: post.id, post });

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-swipe-carousel]')) return;
    const t = e.touches[0];
    if (!t) return;
    swipe.current = { startX: t.clientX, startY: t.clientY, isHorizontal: null };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    const { startX, startY } = swipe.current;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (swipe.current.isHorizontal === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      swipe.current.isHorizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (!swipe.current.isHorizontal || dx <= 0) return;

    if (pageRef.current) {
      pageRef.current.style.transition = 'none';
      pageRef.current.style.transform = `translateX(${dx}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swipe.current.isHorizontal) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - swipe.current.startX;
    if (dx > window.innerWidth * 0.3) {
      if (pageRef.current) {
        pageRef.current.style.transition = 'transform 0.3s ease-out';
        pageRef.current.style.transform = 'translateX(100%)';
      }
      setTimeout(() => router.back(), 300);
    } else {
      if (pageRef.current) {
        pageRef.current.style.transition = 'transform 0.3s ease-out';
        pageRef.current.style.transform = 'translateX(0)';
      }
    }
    swipe.current.isHorizontal = null;
  };

  return (
    <div
      ref={pageRef}
      className="flex-1 p-4 md:p-8 max-xs:px-0"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary font-bold hover:opacity-70 transition-opacity mb-4 px-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>프로필로 돌아가기</span>
        </button>

        {isInitialLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            {items.map((post) => (
              <div key={post.id} id={`post-${post.id}`} style={{ scrollMarginTop: '80px' }}>
                <PostCard
                  post={post}
                  onPlay={handlePlay}
                  onPlayAll={() => handlePlayAll(post)}
                  onUserClick={handleUserClick}
                  onOpenDetail={handleOpenDetail}
                  currentMusicId={currentMusicId}
                  isPlayingGlobal={isPlaying}
                />
              </div>
            ))}
          </div>
        )}

        {hasNext && (
          <div ref={ref}>
            <LoadingSpinner hStyle="py-6" />
          </div>
        )}
        {errorMsg && <p className="text-center text-gray-400 text-sm py-4">{errorMsg}</p>}
      </div>
    </div>
  );
}
