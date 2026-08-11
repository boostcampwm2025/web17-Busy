import type { QueryClient } from '@tanstack/react-query';
import type { GetUserDto as Profile } from '@repo/dto';

import { queryKeys } from '@/api/queryKeys';

type ProfilePatch = Partial<Pick<Profile, 'nickname' | 'profileImgUrl' | 'bio' | 'followerCount' | 'followingCount' | 'isFollowing'>>;

type FollowCacheParams = {
  targetUserId: string;
  viewerUserId: string | null;
  wasFollowing: boolean;
};

const getNextCount = (count: number, delta: number) => Math.max(0, count + delta);

export const patchProfileInCache = (queryClient: QueryClient, userId: string, patch: ProfilePatch | ((profile: Profile) => ProfilePatch)) => {
  queryClient.setQueryData<Profile>(queryKeys.profiles.detail(userId), (current) => {
    if (!current) return current;

    const nextPatch = typeof patch === 'function' ? patch(current) : patch;
    return { ...current, ...nextPatch };
  });
};

export const applyFollowResultToProfileCaches = (queryClient: QueryClient, { targetUserId, viewerUserId, wasFollowing }: FollowCacheParams) => {
  const isFollowing = !wasFollowing;
  const followerDelta = isFollowing ? 1 : -1;
  const followingDelta = isFollowing ? 1 : -1;

  patchProfileInCache(queryClient, targetUserId, (profile) => ({
    isFollowing,
    followerCount: getNextCount(profile.followerCount, followerDelta),
  }));

  if (!viewerUserId || viewerUserId === targetUserId) return;

  patchProfileInCache(queryClient, viewerUserId, (profile) => ({
    followingCount: getNextCount(profile.followingCount, followingDelta),
  }));
};
