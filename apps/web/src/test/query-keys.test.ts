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
});
