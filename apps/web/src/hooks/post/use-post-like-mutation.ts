'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PostResponseDto as Post } from '@repo/dto';

import { addLike, queryKeys, removeLike } from '@/api';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';
import { cancelPostCaches, invalidatePostCaches, setPostPatchInCaches } from './post-cache-updaters';

type LikeState = Pick<Post, 'isLiked' | 'likeCount'>;

type Options = {
  postId: string;
};

type Context = {
  previousOverride: LikeState | undefined;
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
    mutationFn: async (next: LikeState) => {
      if (next.isLiked) await addLike({ postId });
      else await removeLike(postId);
    },
    onMutate: async (next) => {
      await cancelPostCaches(queryClient, postId);

      const previousOverride = usePostReactionOverridesStore.getState().likesByPostId[postId];

      usePostReactionOverridesStore.getState().setLikeOverride(postId, next);
      setPostPatchInCaches(queryClient, postId, next);

      return { previousOverride } satisfies Context;
    },
    onError: (_error, _next, context) => {
      if (context?.previousOverride) {
        usePostReactionOverridesStore.getState().setLikeOverride(postId, context.previousOverride);
      } else {
        usePostReactionOverridesStore.getState().clearLikeOverride(postId);
      }
    },
    onSettled: () => {
      invalidatePostCaches(queryClient, postId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.likedUsers(postId) });
    },
  });
};

export const getOptimisticLikeState = getNextLikeState;
