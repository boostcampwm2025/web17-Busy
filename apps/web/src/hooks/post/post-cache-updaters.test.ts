import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api';
import { createTestQueryClient } from '@/test/render-with-query-client';

import { getPostCacheSnapshot, removePostFromCaches, restoreQueryCacheSnapshot, setPostPatchInCaches } from './post-cache-updaters';

describe('post cache updaters', () => {
  it('patches the same post across detail, feed, and profile list caches', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.posts.detail('post-1'), {
      id: 'post-1',
      isLiked: false,
      likeCount: 1,
      commentCount: 0,
      content: 'before',
    });
    queryClient.setQueryData(queryKeys.posts.feed({ scope: 'all' }), {
      pages: [
        {
          items: [
            { id: 'post-1', isLiked: false, likeCount: 1, commentCount: 0 },
            { id: 'post-2', isLiked: false, likeCount: 5, commentCount: 2 },
          ],
        },
      ],
    });
    queryClient.setQueryData(queryKeys.posts.profiles, {
      posts: [{ id: 'post-1', isLiked: false, likeCount: 1, commentCount: 0 }],
    });

    setPostPatchInCaches(queryClient, 'post-1', {
      isLiked: true,
      likeCount: 2,
      commentCount: 1,
    });

    expect(queryClient.getQueryData(queryKeys.posts.detail('post-1'))).toMatchObject({
      id: 'post-1',
      isLiked: true,
      likeCount: 2,
      commentCount: 1,
      content: 'before',
    });
    expect(queryClient.getQueryData(queryKeys.posts.feed({ scope: 'all' }))).toMatchObject({
      pages: [
        {
          items: [
            { id: 'post-1', isLiked: true, likeCount: 2, commentCount: 1 },
            { id: 'post-2', isLiked: false, likeCount: 5, commentCount: 2 },
          ],
        },
      ],
    });
    expect(queryClient.getQueryData(queryKeys.posts.profiles)).toMatchObject({
      posts: [{ id: 'post-1', isLiked: true, likeCount: 2, commentCount: 1 }],
    });
  });

  it('restores optimistic post cache changes from a snapshot', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.posts.detail('post-1'), {
      id: 'post-1',
      isLiked: false,
      likeCount: 1,
    });

    const snapshot = getPostCacheSnapshot(queryClient, 'post-1');

    setPostPatchInCaches(queryClient, 'post-1', {
      isLiked: true,
      likeCount: 2,
    });
    restoreQueryCacheSnapshot(queryClient, snapshot);

    expect(queryClient.getQueryData(queryKeys.posts.detail('post-1'))).toEqual({
      id: 'post-1',
      isLiked: false,
      likeCount: 1,
    });
  });

  it('removes a deleted post from detail and list caches', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.posts.detail('post-1'), { id: 'post-1' });
    queryClient.setQueryData(queryKeys.posts.feed(), {
      pages: [{ items: [{ id: 'post-1' }, { id: 'post-2' }] }],
    });
    queryClient.setQueryData(queryKeys.posts.profiles, {
      posts: [{ id: 'post-1' }, { id: 'post-3' }],
    });

    removePostFromCaches(queryClient, 'post-1');

    expect(queryClient.getQueryData(queryKeys.posts.detail('post-1'))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.posts.feed())).toEqual({
      pages: [{ items: [{ id: 'post-2' }] }],
    });
    expect(queryClient.getQueryData(queryKeys.posts.profiles)).toEqual({
      posts: [{ id: 'post-3' }],
    });
  });

  it('removes multiple deleted posts without overwriting pending removals', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.posts.feed(), {
      pages: [{ items: [{ id: 'post-1' }, { id: 'post-2' }, { id: 'post-3' }] }],
    });
    queryClient.setQueryData(queryKeys.posts.profiles, {
      posts: [{ id: 'post-1' }, { id: 'post-2' }, { id: 'post-3' }],
    });

    removePostFromCaches(queryClient, 'post-1');
    removePostFromCaches(queryClient, 'post-2');

    expect(queryClient.getQueryData(queryKeys.posts.feed())).toEqual({
      pages: [{ items: [{ id: 'post-3' }] }],
    });
    expect(queryClient.getQueryData(queryKeys.posts.profiles)).toEqual({
      posts: [{ id: 'post-3' }],
    });
  });
});
