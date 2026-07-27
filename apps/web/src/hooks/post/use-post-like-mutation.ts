'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PostResponseDto as Post } from '@repo/dto';

import { addLike, queryKeys, removeLike } from '@/api';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';

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

const applyLikeStateToUnknown = (value: unknown, postId: string, next: LikeState): unknown => {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => applyLikeStateToUnknown(item, postId, next));
  }

  const record = value as Record<string, unknown>;

  if (record.id === postId && typeof record.likeCount === 'number') {
    return { ...record, ...next };
  }

  if (Array.isArray(record.posts)) {
    return {
      ...record,
      posts: record.posts.map((item) => applyLikeStateToUnknown(item, postId, next)),
    };
  }

  if (Array.isArray(record.items)) {
    return {
      ...record,
      items: record.items.map((item) => applyLikeStateToUnknown(item, postId, next)),
    };
  }

  if (Array.isArray(record.pages)) {
    return {
      ...record,
      pages: record.pages.map((item) => applyLikeStateToUnknown(item, postId, next)),
    };
  }

  return value;
};

export const usePostLikeMutation = ({ postId }: Options) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (next: LikeState) => {
      if (next.isLiked) await addLike({ postId });
      else await removeLike(postId);
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.feed() });
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.profiles });

      const previousOverride = usePostReactionOverridesStore.getState().likesByPostId[postId];

      usePostReactionOverridesStore.getState().setLikeOverride(postId, next);
      queryClient.setQueryData(queryKeys.posts.detail(postId), (current) => applyLikeStateToUnknown(current, postId, next));
      queryClient.setQueriesData({ queryKey: queryKeys.posts.feed() }, (current) => applyLikeStateToUnknown(current, postId, next));
      queryClient.setQueriesData({ queryKey: queryKeys.posts.profiles }, (current) => applyLikeStateToUnknown(current, postId, next));

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
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.feed() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.profiles });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.likedUsers(postId) });
    },
  });
};

export const getOptimisticLikeState = getNextLikeState;
