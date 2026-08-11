import type { GetUserDto as Profile } from '@repo/dto';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/render-with-query-client';

import { applyFollowResultToProfileCaches, patchProfileInCache } from './profile-cache-updaters';

const createProfile = (overrides: Partial<Profile>): Profile =>
  ({
    id: 'user-1',
    nickname: 'user',
    profileImgUrl: null,
    bio: null,
    followerCount: 0,
    followingCount: 0,
    isFollowing: false,
    ...overrides,
  }) as Profile;

describe('profile cache updaters', () => {
  it('patches profile fields without replacing the whole cached profile', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.profiles.detail('user-1'), createProfile({ id: 'user-1', nickname: 'before', bio: 'old bio' }));

    patchProfileInCache(queryClient, 'user-1', {
      nickname: 'after',
      bio: 'new bio',
    });

    expect(queryClient.getQueryData(queryKeys.profiles.detail('user-1'))).toMatchObject({
      id: 'user-1',
      nickname: 'after',
      bio: 'new bio',
      followerCount: 0,
      followingCount: 0,
    });
  });

  it('applies follow result to target follower count and viewer following count', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.profiles.detail('target-user'), createProfile({ id: 'target-user', followerCount: 2, isFollowing: false }));
    queryClient.setQueryData(queryKeys.profiles.detail('viewer-user'), createProfile({ id: 'viewer-user', followingCount: 4 }));

    applyFollowResultToProfileCaches(queryClient, {
      targetUserId: 'target-user',
      viewerUserId: 'viewer-user',
      wasFollowing: false,
    });

    expect(queryClient.getQueryData(queryKeys.profiles.detail('target-user'))).toMatchObject({
      followerCount: 3,
      isFollowing: true,
    });
    expect(queryClient.getQueryData(queryKeys.profiles.detail('viewer-user'))).toMatchObject({
      followingCount: 5,
    });
  });

  it('does not decrement profile counts below zero on unfollow rollback paths', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.profiles.detail('target-user'), createProfile({ id: 'target-user', followerCount: 0, isFollowing: true }));
    queryClient.setQueryData(queryKeys.profiles.detail('viewer-user'), createProfile({ id: 'viewer-user', followingCount: 0 }));

    applyFollowResultToProfileCaches(queryClient, {
      targetUserId: 'target-user',
      viewerUserId: 'viewer-user',
      wasFollowing: true,
    });

    expect(queryClient.getQueryData(queryKeys.profiles.detail('target-user'))).toMatchObject({
      followerCount: 0,
      isFollowing: false,
    });
    expect(queryClient.getQueryData(queryKeys.profiles.detail('viewer-user'))).toMatchObject({
      followingCount: 0,
    });
  });
});
