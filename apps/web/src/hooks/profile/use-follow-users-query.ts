'use client';

import { useCallback } from 'react';

import { getFollowerUsers, getFollowingUsers } from '@/api/internal/follow';
import { queryKeys } from '@/api/queryKeys';
import useInfiniteScroll from '@/hooks/use-infinite-scroll';

export type FollowListType = 'followers' | 'followings';

const FETCH_FOLLOW_USERS = {
  followers: getFollowerUsers,
  followings: getFollowingUsers,
} as const;

/** 팔로워·팔로잉 목록. 같은 사용자라도 목록 종류마다 결과가 다르므로 key를 종류로 가른다. */
export const useFollowUsersQuery = (listType: FollowListType, userId: string) => {
  const fetchFn = useCallback(
    async (cursor?: string, limit?: number) => {
      const { users, hasNext, nextCursor } = await FETCH_FOLLOW_USERS[listType](userId, cursor, limit);

      return { items: users, hasNext, nextCursor };
    },
    [listType, userId],
  );

  return useInfiniteScroll({
    queryKey: queryKeys.users.list(listType, userId),
    fetchFn,
  });
};
