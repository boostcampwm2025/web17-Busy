'use client';

import { useEffect } from 'react';
import { useInfiniteScroll } from '@/hooks';
import { getFeedPosts } from '@/api';
import { FeedSkeleton } from '../skeleton';
import LoadingSpinner from '../LoadingSpinner';
import FeedList from './FeedList';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';

import { queryKeys } from '@/api';
import { Cursor, PostResponseDto } from '@repo/dto';

interface FeedViewProps {
  initialPost?: PostResponseDto;
}

/** 서버가 페이지 간 중복 게시글을 반환할 수 있어 방어한다. 서버 중복 제거(#392) 이후 존치 여부를 판단한다. */
const dedupePosts = (posts: PostResponseDto[]) => Array.from(new Map(posts.map((post) => [post.id, post])).values());

export default function FeedView({ initialPost }: FeedViewProps) {
  const openModal = useModalStore((s) => s.openModal);

  useEffect(() => {
    if (initialPost) {
      openModal(MODAL_TYPES.POST_DETAIL, { postId: initialPost.id, initialPost });
    }
  }, [initialPost, openModal]);

  const { items, hasNext, isInitialLoading, errorMsg, ref } = useInfiniteScroll<PostResponseDto, Cursor>({
    queryKey: queryKeys.posts.feed(initialPost ? { initialPostId: initialPost.id } : undefined),
    fetchFn: getFeedPosts,
    initialItems: initialPost ? [initialPost] : [],
    dedupeItems: dedupePosts,
  });

  if (isInitialLoading && !initialPost) return <FeedSkeleton />;

  return (
    <>
      <FeedList posts={items} />
      {errorMsg && (
        <div className="text-center">
          <p>{errorMsg}</p>
          <p className="text-sm mt-2">다시 시도해주세요.</p>
        </div>
      )}
      {hasNext && (
        <div ref={ref}>
          <LoadingSpinner hStyle="py-6" />
        </div>
      )}
    </>
  );
}
