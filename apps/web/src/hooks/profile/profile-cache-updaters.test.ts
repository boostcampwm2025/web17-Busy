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

  it('applies the follow result to every cached page of an open user list', () => {
    const queryClient = createTestQueryClient();

    queryClient.setQueryData(queryKeys.users.list('팔로워', 'profile-user'), {
      pages: [
        { items: [{ id: 'target-user', isFollowing: false }], hasNext: true },
        { items: [{ id: 'other-user', isFollowing: false }], hasNext: false },
      ],
      pageParams: [undefined, 'cursor-1'],
    });

    applyFollowResultToProfileCaches(queryClient, {
      targetUserId: 'target-user',
      viewerUserId: 'viewer-user',
      wasFollowing: false,
    });

    expect(queryClient.getQueryData(queryKeys.users.list('팔로워', 'profile-user'))).toMatchObject({
      pages: [{ items: [{ id: 'target-user', isFollowing: true }] }, { items: [{ id: 'other-user', isFollowing: false }] }],
    });
  });

  it('applies the follow result to follower and following lists at the same time', () => {
    const queryClient = createTestQueryClient();
    const followerKey = queryKeys.users.list('팔로워', 'profile-user');
    const followingKey = queryKeys.users.list('팔로잉', 'profile-user');
    const createList = () => ({ pages: [{ items: [{ id: 'target-user', isFollowing: true }], hasNext: false }], pageParams: [undefined] });

    queryClient.setQueryData(followerKey, createList());
    queryClient.setQueryData(followingKey, createList());

    applyFollowResultToProfileCaches(queryClient, {
      targetUserId: 'target-user',
      viewerUserId: 'viewer-user',
      wasFollowing: true,
    });

    expect(queryClient.getQueryData(followerKey)).toMatchObject({ pages: [{ items: [{ isFollowing: false }] }] });
    expect(queryClient.getQueryData(followingKey)).toMatchObject({ pages: [{ items: [{ isFollowing: false }] }] });
  });
});
