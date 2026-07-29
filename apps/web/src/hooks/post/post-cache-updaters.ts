import type { QueryClient } from '@tanstack/react-query';
import type { PostResponseDto as Post } from '@repo/dto';

import { queryKeys } from '@/api';

type PostPatch = Partial<Pick<Post, 'isLiked' | 'likeCount' | 'commentCount' | 'content'>>;

export const applyPostPatchToUnknown = (value: unknown, postId: string, patch: PostPatch): unknown => {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => applyPostPatchToUnknown(item, postId, patch));
  }

  const record = value as Record<string, unknown>;

  if (record.id === postId) {
    return { ...record, ...patch };
  }

  if (Array.isArray(record.posts)) {
    return {
      ...record,
      posts: record.posts.map((item) => applyPostPatchToUnknown(item, postId, patch)),
    };
  }

  if (Array.isArray(record.items)) {
    return {
      ...record,
      items: record.items.map((item) => applyPostPatchToUnknown(item, postId, patch)),
    };
  }

  if (Array.isArray(record.pages)) {
    return {
      ...record,
      pages: record.pages.map((item) => applyPostPatchToUnknown(item, postId, patch)),
    };
  }

  return value;
};

export const removePostFromUnknown = (value: unknown, postId: string): unknown => {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.reduce<unknown[]>((acc, item) => {
      if (item && typeof item === 'object' && (item as Record<string, unknown>).id === postId) return acc;
      const next = removePostFromUnknown(item, postId);
      if (next !== undefined) acc.push(next);
      return acc;
    }, []);
  }

  const record = value as Record<string, unknown>;

  if (record.id === postId) return undefined;

  if (Array.isArray(record.posts)) {
    return {
      ...record,
      posts: removePostFromUnknown(record.posts, postId),
    };
  }

  if (Array.isArray(record.items)) {
    return {
      ...record,
      items: removePostFromUnknown(record.items, postId),
    };
  }

  if (Array.isArray(record.pages)) {
    return {
      ...record,
      pages: removePostFromUnknown(record.pages, postId),
    };
  }

  return value;
};

export const cancelPostCaches = async (queryClient: QueryClient, postId: string) => {
  await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) });
  await queryClient.cancelQueries({ queryKey: queryKeys.posts.feed() });
  await queryClient.cancelQueries({ queryKey: queryKeys.posts.profiles });
};

export const setPostPatchInCaches = (queryClient: QueryClient, postId: string, patch: PostPatch) => {
  queryClient.setQueryData(queryKeys.posts.detail(postId), (current) => applyPostPatchToUnknown(current, postId, patch));
  queryClient.setQueriesData({ queryKey: queryKeys.posts.feed() }, (current) => applyPostPatchToUnknown(current, postId, patch));
  queryClient.setQueriesData({ queryKey: queryKeys.posts.profiles }, (current) => applyPostPatchToUnknown(current, postId, patch));
};

export const removePostFromCaches = (queryClient: QueryClient, postId: string) => {
  queryClient.setQueryData(queryKeys.posts.detail(postId), undefined);
  queryClient.setQueriesData({ queryKey: queryKeys.posts.feed() }, (current) => removePostFromUnknown(current, postId));
  queryClient.setQueriesData({ queryKey: queryKeys.posts.profiles }, (current) => removePostFromUnknown(current, postId));
};

export const invalidatePostCaches = (queryClient: QueryClient, postId: string) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.posts.feed() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.posts.profiles });
};

export const invalidatePostListCaches = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.posts.feed() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.posts.profiles });
};
