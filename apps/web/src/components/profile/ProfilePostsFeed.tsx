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
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.id ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const isMobile = useIsMobile();
  const isMobileInitializedRef = useRef(false);
  const prevIsMobileRef = useRef(false);
  const didScrollRef = useRef(false);

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
  const handleUserClick = (uid: string) => router.push(`/profile/${uid}`);
  const handleOpenDetail = (post: Post) => openModal(MODAL_TYPES.POST_DETAIL, { postId: post.id, post });

  return (
    <div className="flex-1 p-4 md:p-8 max-xs:px-0">
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
