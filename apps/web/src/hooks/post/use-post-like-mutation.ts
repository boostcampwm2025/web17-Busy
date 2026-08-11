'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PostResponseDto as Post } from '@repo/dto';

import { addLike, removeLike } from '@/api/internal/like';
import { queryKeys } from '@/api/queryKeys';
import {
  cancelPostCaches,
  getPostCacheSnapshot,
  invalidatePostCaches,
  restoreQueryCacheSnapshot,
  setPostPatchInCaches,
  type QueryCacheSnapshot,
} from './post-cache-updaters';

type LikeState = Pick<Post, 'isLiked' | 'likeCount'>;

type Options = {
  postId: string;
};

type Context = {
  previousPostCaches: QueryCacheSnapshot;
};

const getNextLikeState = ({ isLiked, likeCount }: LikeState): LikeState => {
  const isNextLiked = !isLiked;
  return {
    isLiked: isNextLiked,
    likeCount: Math.max(0, likeCount + (isNextLiked ? 1 : -1)),
  };
};

export const usePostLikeMutation = ({ postId }: Options) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (current: LikeState) => {
      const next = getNextLikeState(current);

      if (next.isLiked) await addLike({ postId });
      else await removeLike(postId);
    },
    onMutate: async (current) => {
      await cancelPostCaches(queryClient, postId);

      const previousPostCaches = getPostCacheSnapshot(queryClient, postId);
      const next = getNextLikeState(current);

      setPostPatchInCaches(queryClient, postId, next);

      return { previousPostCaches } satisfies Context;
    },
    onError: (_error, _current, context) => {
      if (!context) return;

      restoreQueryCacheSnapshot(queryClient, context.previousPostCaches);
    },
    onSettled: () => {
      invalidatePostCaches(queryClient, postId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.likedUsers(postId) });
    },
  });
};
