'use client';

import { useCallback } from 'react';
import { getUserProfilePosts, queryKeys } from '@/api';
import { useInfiniteScroll, useProfileQuery } from '@/hooks';
import { useAuthStore } from '@/stores';
import { ProfileSkeleton } from '../skeleton';
import { ProfileInfo } from './ProfileInfo';
import ProfilePosts from './ProfilePosts';
import LoadingSpinner from '../LoadingSpinner';

export default function ProfileView({ userId }: { userId: string }) {
  const loggedInUserId = useAuthStore((s) => s.userId);
  const profileQuery = useProfileQuery(userId);

  const isMyProfile = loggedInUserId === userId;

  /** fetch 함수 반환 형식을 무한 스크롤 hook 시그니처에 맞게 변환하는 함수 */
  const fetchProfilePosts = useCallback(
    async (cursor?: string, limit?: number) => {
      const data = await getUserProfilePosts(userId, cursor, limit);
      return data;
    },
    [userId],
  );

  const { items, hasNext, isInitialLoading, errorMsg, ref } = useInfiniteScroll({
    queryKey: queryKeys.posts.profile(userId),
    fetchFn: fetchProfilePosts,
  });

  if (profileQuery.error) throw profileQuery.error;

  const profile = profileQuery.data;

  if (isInitialLoading || profileQuery.isLoading || profile?.id !== userId) return <ProfileSkeleton />;

  return (
    <div className="h-full flex flex-col mx-auto p-6 md:p-10 gap-y-4">
      <ProfileInfo profile={profile} loggedInUserId={loggedInUserId} />
      <ProfilePosts posts={items} isMyProfile={isMyProfile} userId={userId} />
      {errorMsg && (
        <div className="text-center">
          <p>{errorMsg}</p>
          <p className="text-sm mt-2">다시 시도해주세요.</p>
        </div>
      )}
      {hasNext && (
        <div ref={ref}>
          <LoadingSpinner hStyle="py-6" />
        </div>
      )}
    </div>
  );
}
