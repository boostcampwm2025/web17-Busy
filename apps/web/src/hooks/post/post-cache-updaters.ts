import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { PostResponseDto as Post } from '@repo/dto';

import { queryKeys } from '@/api/queryKeys';

type PostPatch = Partial<Pick<Post, 'isLiked' | 'likeCount' | 'commentCount' | 'content'>>;
type QueryCacheSnapshotEntry = [QueryKey, unknown];

export type QueryCacheSnapshot = QueryCacheSnapshotEntry[];

const getPostCacheKeys = (postId: string): QueryKey[] => [queryKeys.posts.detail(postId), queryKeys.posts.feed(), queryKeys.posts.profiles];
const getPostListCacheKeys = (): QueryKey[] => [queryKeys.posts.feed(), queryKeys.posts.profiles];

/**
 * 게시글 cache는 형태마다 식별자 필드가 다르다.
 * 피드·상세·모바일 프로필 피드는 `PostResponseDto`라 `id`를, 프로필 격자는 `PostPreviewDto`라 `postId`를 쓴다.
 * 한쪽만 보면 다른 쪽 cache에서 아무 항목도 찾지 못한 채 조용히 통과한다.
 */
const isTargetPost = (record: Record<string, unknown>, postId: string) => record.id === postId || record.postId === postId;

export const applyPostPatchToUnknown = (value: unknown, postId: string, patch: PostPatch): unknown => {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => applyPostPatchToUnknown(item, postId, patch));
  }

  const record = value as Record<string, unknown>;

  if (isTargetPost(record, postId)) {
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
    // 대상 항목은 아래에서 undefined로 돌아오므로, 여기서는 그 결과만 걸러낸다.
    return value.reduce<unknown[]>((acc, item) => {
      const next = removePostFromUnknown(item, postId);
      if (next !== undefined) acc.push(next);
      return acc;
    }, []);
  }

  const record = value as Record<string, unknown>;

  if (isTargetPost(record, postId)) return undefined;

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

const getQueryCacheSnapshot = (queryClient: QueryClient, queryKey: QueryKey): QueryCacheSnapshot => queryClient.getQueriesData({ queryKey });

export const getPostCacheSnapshot = (queryClient: QueryClient, postId: string): QueryCacheSnapshot =>
  getPostCacheKeys(postId).flatMap((queryKey) => getQueryCacheSnapshot(queryClient, queryKey));

export const restoreQueryCacheSnapshot = (queryClient: QueryClient, snapshot: QueryCacheSnapshot) => {
  snapshot.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
};

export const cancelPostCaches = async (queryClient: QueryClient, postId: string) => {
  await Promise.all(getPostCacheKeys(postId).map((queryKey) => queryClient.cancelQueries({ queryKey })));
};

export const setPostPatchInCaches = (queryClient: QueryClient, postId: string, patch: PostPatch) => {
  getPostCacheKeys(postId).forEach((queryKey) => {
    queryClient.setQueriesData({ queryKey }, (current) => applyPostPatchToUnknown(current, postId, patch));
  });
};

export const removePostFromCaches = (queryClient: QueryClient, postId: string) => {
  queryClient.removeQueries({ queryKey: queryKeys.posts.detail(postId), exact: true });
  getPostListCacheKeys().forEach((queryKey) => {
    queryClient.setQueriesData({ queryKey }, (current) => removePostFromUnknown(current, postId));
  });
};

export const invalidatePostCaches = (queryClient: QueryClient, postId: string) => {
  getPostCacheKeys(postId).forEach((queryKey) => {
    void queryClient.invalidateQueries({ queryKey });
  });
};

export const invalidatePostListCaches = (queryClient: QueryClient) => {
  getPostListCacheKeys().forEach((queryKey) => {
    void queryClient.invalidateQueries({ queryKey });
  });
};
