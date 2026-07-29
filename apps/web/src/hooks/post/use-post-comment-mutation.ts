'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GetCommentsResDto, UserDto } from '@repo/dto';

import { createComment, queryKeys } from '@/api';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';
import { cancelPostCaches, invalidatePostCaches, setPostPatchInCaches } from './post-cache-updaters';

type CommentItem = GetCommentsResDto['comments'][number];
type CommentOverride = {
  commentCount: number;
};

type Options = {
  postId: string;
  onCommentCountChange: (count: number) => void;
};

type Variables = {
  content: string;
  author: UserDto;
  currentCommentCount: number;
};

type Context = {
  tmpId: string;
  previousComments: GetCommentsResDto | undefined;
  previousOverride: CommentOverride | undefined;
  previousCommentCount: number;
};

const nowIso = () => new Date().toISOString();

const createOptimisticComment = ({ tmpId, content, author }: Pick<Variables, 'content' | 'author'> & { tmpId: string }): CommentItem => ({
  id: tmpId,
  content,
  createdAt: nowIso(),
  author,
});

export const usePostCommentMutation = ({ postId, onCommentCountChange }: Options) => {
  const queryClient = useQueryClient();

  const applyCommentCount = (count: number) => {
    onCommentCountChange(count);
    usePostReactionOverridesStore.getState().setCommentOverride(postId, { commentCount: count });
    setPostPatchInCaches(queryClient, postId, { commentCount: count });
  };

  const restoreCommentCount = (count: number, previousOverride: CommentOverride | undefined) => {
    const restoredCount = previousOverride?.commentCount ?? count;

    onCommentCountChange(restoredCount);
    setPostPatchInCaches(queryClient, postId, { commentCount: restoredCount });

    if (previousOverride) {
      usePostReactionOverridesStore.getState().setCommentOverride(postId, previousOverride);
    } else {
      usePostReactionOverridesStore.getState().clearCommentOverride(postId);
    }
  };

  return useMutation({
    mutationFn: async ({ content }: Variables) => createComment({ postId, content }),
    onMutate: async ({ content, author, currentCommentCount }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.comments(postId) });
      await cancelPostCaches(queryClient, postId);

      const commentsKey = queryKeys.posts.comments(postId);
      const previousComments = queryClient.getQueryData<GetCommentsResDto>(commentsKey);
      const previousOverride = usePostReactionOverridesStore.getState().commentsByPostId[postId];
      const tmpId = `tmp-${Date.now()}`;
      const optimistic = createOptimisticComment({ tmpId, content, author });

      queryClient.setQueryData<GetCommentsResDto>(commentsKey, (current) => ({
        comments: [...(current?.comments ?? []), optimistic],
      }));

      applyCommentCount(currentCommentCount + 1);

      return {
        tmpId,
        previousComments,
        previousOverride,
        previousCommentCount: currentCommentCount,
      } satisfies Context;
    },
    onSuccess: (res, _variables, context) => {
      if (!context) return;

      queryClient.setQueryData<GetCommentsResDto>(queryKeys.posts.comments(postId), (current) => {
        if (!current) return current;

        return {
          comments: current.comments.map((comment) => (comment.id === context.tmpId ? { ...comment, id: res.id } : comment)),
        };
      });
    },
    onError: (_error, _variables, context) => {
      if (!context) return;

      queryClient.setQueryData<GetCommentsResDto>(queryKeys.posts.comments(postId), context.previousComments ?? { comments: [] });
      restoreCommentCount(context.previousCommentCount, context.previousOverride);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.comments(postId) });
      invalidatePostCaches(queryClient, postId);
    },
  });
};
