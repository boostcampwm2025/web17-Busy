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

  it('keeps both profile post keys under the shared profiles prefix', () => {
    const prefix = queryKeys.posts.profiles;

    expect(queryKeys.posts.profile('user-1').slice(0, prefix.length)).toEqual([...prefix]);
    expect(queryKeys.posts.profileFull('user-1').slice(0, prefix.length)).toEqual([...prefix]);
  });
});
