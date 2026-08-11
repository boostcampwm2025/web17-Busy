'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GetCommentsResDto, UserDto } from '@repo/dto';

import { createComment } from '@/api/internal/comment';
import { queryKeys } from '@/api/queryKeys';
import {
  cancelPostCaches,
  getPostCacheSnapshot,
  invalidatePostCaches,
  restoreQueryCacheSnapshot,
  setPostPatchInCaches,
  type QueryCacheSnapshot,
} from './post-cache-updaters';

type CommentItem = GetCommentsResDto['comments'][number];

type Options = {
  postId: string;
};

type Variables = {
  content: string;
  author: UserDto;
  currentCommentCount: number;
};

type Context = {
  tmpId: string;
  previousComments: GetCommentsResDto | undefined;
  previousPostCaches: QueryCacheSnapshot;
};

const nowIso = () => new Date().toISOString();

const createOptimisticComment = ({ tmpId, content, author }: Pick<Variables, 'content' | 'author'> & { tmpId: string }): CommentItem => ({
  id: tmpId,
  content,
  createdAt: nowIso(),
  author,
});

export const usePostCommentMutation = ({ postId }: Options) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content }: Variables) => createComment({ postId, content }),
    onMutate: async ({ content, author, currentCommentCount }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.comments(postId) });
      await cancelPostCaches(queryClient, postId);

      const commentsKey = queryKeys.posts.comments(postId);
      const previousComments = queryClient.getQueryData<GetCommentsResDto>(commentsKey);
      const previousPostCaches = getPostCacheSnapshot(queryClient, postId);
      const tmpId = `tmp-${Date.now()}`;
      const optimistic = createOptimisticComment({ tmpId, content, author });

      queryClient.setQueryData<GetCommentsResDto>(commentsKey, (current) => ({
        comments: [...(current?.comments ?? []), optimistic],
      }));

      setPostPatchInCaches(queryClient, postId, { commentCount: currentCommentCount + 1 });

      return {
        tmpId,
        previousComments,
        previousPostCaches,
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
      restoreQueryCacheSnapshot(queryClient, context.previousPostCaches);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.comments(postId) });
      invalidatePostCaches(queryClient, postId);
    },
  });
};
