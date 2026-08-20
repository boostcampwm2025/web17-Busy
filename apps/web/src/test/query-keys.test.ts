import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api/queryKeys';

describe('queryKeys', () => {
  it('returns stable keys for shared server resources', () => {
    expect(queryKeys.auth.me).toEqual(['auth', 'me']);
    expect(queryKeys.notifications.all).toEqual(['notifications']);
    expect(queryKeys.playlists.all).toEqual(['playlists']);
    expect(queryKeys.playlists.detail('playlist-1')).toEqual(['playlists', 'detail', 'playlist-1']);
  });

  it('includes resource ids and query params in post keys', () => {
    expect(queryKeys.posts.feed()).toEqual(['feed']);
    expect(queryKeys.posts.feed({ scope: 'following' })).toEqual(['feed', { scope: 'following' }]);
    expect(queryKeys.posts.profile('user-1')).toEqual(['profile', 'posts', 'user-1']);
    expect(queryKeys.posts.detail('post-1')).toEqual(['post', 'post-1']);
    expect(queryKeys.posts.comments('post-1')).toEqual(['postComments', 'post-1']);
    expect(queryKeys.posts.likedUsers('post-1')).toEqual(['postLikedUsers', 'post-1']);
  });

  it('separates the profile grid key from the profile full-post feed key', () => {
    expect(queryKeys.posts.profileFull('user-1')).toEqual(['profile', 'posts', 'full', 'user-1']);
    expect(queryKeys.posts.profileFull('user-1')).not.toEqual(queryKeys.posts.profile('user-1'));
  });

  it('separates follower and following lists while keeping them under one prefix', () => {
    const prefix = queryKeys.users.lists;

    expect(queryKeys.users.list('팔로워', 'user-1')).toEqual(['user-list', '팔로워', 'user-1']);
    expect(queryKeys.users.list('팔로워', 'user-1')).not.toEqual(queryKeys.users.list('팔로잉', 'user-1'));
    expect(queryKeys.users.list('팔로워', 'user-1').slice(0, prefix.length)).toEqual([...prefix]);
    expect(queryKeys.users.list('팔로잉', 'user-1').slice(0, prefix.length)).toEqual([...prefix]);
  });

  it('separates user search results by query and limit', () => {
    const prefix = queryKeys.search.all;

    expect(queryKeys.search.users('jane', 10)).toEqual(['search', 'users', 'jane', 10]);
    expect(queryKeys.search.users('jane', 10)).not.toEqual(queryKeys.search.users('john', 10));
    // limit이 페이지 경계를 바꾸므로 같은 검색어라도 다른 결과다.
    expect(queryKeys.search.users('jane', 10)).not.toEqual(queryKeys.search.users('jane', 20));
    expect(queryKeys.search.users('jane', 10).slice(0, prefix.length)).toEqual([...prefix]);
  });

  it('keeps every user search result under one prefix regardless of query and limit', () => {
    // 팔로우 상태는 검색어·limit과 무관하게 모든 사용자 검색 결과에 함께 반영돼야 한다.
    const prefix = queryKeys.search.userLists;

    expect(prefix).toEqual(['search', 'users']);
    expect(queryKeys.search.users('jane', 10).slice(0, prefix.length)).toEqual([...prefix]);
    expect(queryKeys.search.users('john', 20).slice(0, prefix.length)).toEqual([...prefix]);
  });

  it('keeps both profile post keys under the shared profiles prefix', () => {
    const prefix = queryKeys.posts.profiles;

    expect(queryKeys.posts.profile('user-1').slice(0, prefix.length)).toEqual([...prefix]);
    expect(queryKeys.posts.profileFull('user-1').slice(0, prefix.length)).toEqual([...prefix]);
  });
});
