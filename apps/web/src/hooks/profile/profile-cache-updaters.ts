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

/**
 * 무한 스크롤 사용자 목록 cache는 `{ pages: [{ items: [...] }] }` 형태다.
 * 페이지 수와 중첩이 목록마다 달라 구조를 따라 내려가며 대상 사용자만 교체한다.
 */
const applyFollowPatchToUnknown = (value: unknown, userId: string, isFollowing: boolean): unknown => {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => applyFollowPatchToUnknown(item, userId, isFollowing));
  }

  const record = value as Record<string, unknown>;

  if (record.id === userId) return { ...record, isFollowing };

  if (Array.isArray(record.items)) {
    return { ...record, items: record.items.map((item) => applyFollowPatchToUnknown(item, userId, isFollowing)) };
  }

  if (Array.isArray(record.pages)) {
    return { ...record, pages: record.pages.map((item) => applyFollowPatchToUnknown(item, userId, isFollowing)) };
  }

  return value;
};

/**
 * 열려 있는 팔로워/팔로잉 목록에 팔로우 결과를 반영한다.
 * 목록을 로컬 state로 복사해 고치면 다음 페이지가 도착할 때 되돌아가므로 cache를 직접 갱신한다.
 */
export const setFollowStateInUserListCaches = (queryClient: QueryClient, userId: string, isFollowing: boolean) => {
  queryClient.setQueriesData({ queryKey: queryKeys.users.lists }, (current) => applyFollowPatchToUnknown(current, userId, isFollowing));
};

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

  setFollowStateInUserListCaches(queryClient, targetUserId, isFollowing);

  if (!viewerUserId || viewerUserId === targetUserId) return;

  patchProfileInCache(queryClient, viewerUserId, (profile) => ({
    followingCount: getNextCount(profile.followingCount, followingDelta),
  }));
};
