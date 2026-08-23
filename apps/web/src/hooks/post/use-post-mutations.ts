'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deletePost, updatePost } from '@/api/internal/post';
import { invalidatePostCaches, invalidatePostListCaches, removePostFromCaches, setPostPatchInCaches } from './post-cache-updaters';

type DeleteOptions = {
  postId: string;
  onDeleted?: () => void;
};

type UpdateOptions = {
  postId: string;
};

/**
 * 삭제된 게시글은 상세 key를 다시 조회하면 404가 나므로, 구독을 끊은 뒤 캐시에서 걷어낸다.
 * 목록은 서버 기준으로 다시 맞춘다.
 */
export const useDeletePostMutation = ({ postId, onDeleted }: DeleteOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      removePostFromCaches(queryClient, postId);
      onDeleted?.();
      invalidatePostListCaches(queryClient);
    },
  });
};

export const useUpdatePostMutation = ({ postId }: UpdateOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => updatePost(postId, { content }),
    onSuccess: (_data, content) => {
      setPostPatchInCaches(queryClient, postId, { content });
    },
    onSettled: () => {
      invalidatePostCaches(queryClient, postId);
    },
  });
};
