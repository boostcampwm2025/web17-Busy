import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/render-with-query-client';

import { getPostCacheSnapshot, removePostFromCaches, restoreQueryCacheSnapshot, setPostPatchInCaches } from './post-cache-updaters';

const USER_ID = 'user-1';

/** 무한 스크롤 cache 한 페이지. `useInfiniteScroll`이 요구하는 응답 형태와 같다. */
const page = <TItem>(items: TItem[]) => ({ items, hasNext: false, nextCursor: undefined });

/** 무한 스크롤 query가 cache에 담는 실제 형태. `select`로 가공되기 전 원본이다. */
const infinite = <TItem>(items: TItem[]) => ({ pages: [page(items)], pageParams: [undefined] });

/** 피드·모바일 프로필 피드 항목. `PostResponseDto`라 식별자가 `id`다. */
const feedItem = (id: string, extra: Record<string, unknown> = {}) => ({ id, isLiked: false, likeCount: 1, commentCount: 0, ...extra });

/** 프로필 격자 항목. `PostPreviewDto`라 식별자가 `postId`이고 `isLiked`·`content`가 없다. */
const gridItem = (postId: string, extra: Record<string, unknown> = {}) => ({
  postId,
  coverImgUrl: `https://cdn.test/${postId}.jpg`,
  likeCount: 1,
  commentCount: 0,
  isMoreThanOneMusic: false,
  ...extra,
});

describe('post cache updaters', () => {
  it('patches the same post across detail, feed, and profile feed caches', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.posts.detail('post-1'), feedItem('post-1', { content: 'before' }));
    queryClient.setQueryData(
      queryKeys.posts.feed({ scope: 'all' }),
      infinite([feedItem('post-1'), feedItem('post-2', { likeCount: 5, commentCount: 2 })]),
    );
    queryClient.setQueryData(queryKeys.posts.profileFull(USER_ID), infinite([feedItem('post-1')]));

    setPostPatchInCaches(queryClient, 'post-1', { isLiked: true, likeCount: 2, commentCount: 1 });

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
    expect(queryClient.getQueryData(queryKeys.posts.profileFull(USER_ID))).toMatchObject({
      pages: [{ items: [{ id: 'post-1', isLiked: true, likeCount: 2, commentCount: 1 }] }],
    });
  });

  it('patches profile grid items that identify a post by postId', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.posts.profile(USER_ID), infinite([gridItem('post-1'), gridItem('post-2', { likeCount: 5, commentCount: 2 })]));

    setPostPatchInCaches(queryClient, 'post-1', { isLiked: true, likeCount: 2, commentCount: 1 });

    expect(queryClient.getQueryData(queryKeys.posts.profile(USER_ID))).toMatchObject({
      pages: [
        {
          items: [
            { postId: 'post-1', likeCount: 2, commentCount: 1 },
            { postId: 'post-2', likeCount: 5, commentCount: 2 },
          ],
        },
      ],
    });
  });

  it('patches the grid and the mobile profile feed of the same user together', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.posts.profile(USER_ID), infinite([gridItem('post-1')]));
    queryClient.setQueryData(queryKeys.posts.profileFull(USER_ID), infinite([feedItem('post-1')]));

    setPostPatchInCaches(queryClient, 'post-1', { likeCount: 7 });

    expect(queryClient.getQueryData(queryKeys.posts.profile(USER_ID))).toMatchObject({
      pages: [{ items: [{ postId: 'post-1', likeCount: 7 }] }],
    });
    expect(queryClient.getQueryData(queryKeys.posts.profileFull(USER_ID))).toMatchObject({
      pages: [{ items: [{ id: 'post-1', likeCount: 7 }] }],
    });
  });

  it('restores optimistic post cache changes from a snapshot', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.posts.detail('post-1'), feedItem('post-1'));
    queryClient.setQueryData(queryKeys.posts.profile(USER_ID), infinite([gridItem('post-1')]));

    const snapshot = getPostCacheSnapshot(queryClient, 'post-1');

    setPostPatchInCaches(queryClient, 'post-1', { isLiked: true, likeCount: 2 });
    restoreQueryCacheSnapshot(queryClient, snapshot);

    expect(queryClient.getQueryData(queryKeys.posts.detail('post-1'))).toEqual(feedItem('post-1'));
    expect(queryClient.getQueryData(queryKeys.posts.profile(USER_ID))).toEqual(infinite([gridItem('post-1')]));
  });

  it('removes a deleted post from detail, feed, and grid caches', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.posts.detail('post-1'), feedItem('post-1'));
    queryClient.setQueryData(queryKeys.posts.feed(), infinite([feedItem('post-1'), feedItem('post-2')]));
    queryClient.setQueryData(queryKeys.posts.profile(USER_ID), infinite([gridItem('post-1'), gridItem('post-3')]));

    removePostFromCaches(queryClient, 'post-1');

    expect(queryClient.getQueryData(queryKeys.posts.detail('post-1'))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.posts.feed())).toEqual(infinite([feedItem('post-2')]));
    expect(queryClient.getQueryData(queryKeys.posts.profile(USER_ID))).toEqual(infinite([gridItem('post-3')]));
  });

  it('removes multiple deleted posts without overwriting pending removals', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.posts.feed(), infinite([feedItem('post-1'), feedItem('post-2'), feedItem('post-3')]));
    queryClient.setQueryData(queryKeys.posts.profile(USER_ID), infinite([gridItem('post-1'), gridItem('post-2'), gridItem('post-3')]));

    removePostFromCaches(queryClient, 'post-1');
    removePostFromCaches(queryClient, 'post-2');

    expect(queryClient.getQueryData(queryKeys.posts.feed())).toEqual(infinite([feedItem('post-3')]));
    expect(queryClient.getQueryData(queryKeys.posts.profile(USER_ID))).toEqual(infinite([gridItem('post-3')]));
  });
});
