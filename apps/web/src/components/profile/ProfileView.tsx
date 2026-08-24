'use client';

import { useProfileQuery } from '@/hooks';
import { useProfilePostsQuery } from '@/hooks/post/use-post-list-queries';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { ProfileSkeleton } from '@/components/common/skeleton';
import { ProfileInfo } from './ProfileInfo';
import ProfilePosts from './ProfilePosts';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function ProfileView({ userId }: { userId: string }) {
  const { userId: loggedInUserId } = useAuthMe();
  const profileQuery = useProfileQuery(userId);

  const isMyProfile = loggedInUserId === userId;

  const { items, hasNext, isInitialLoading, errorMsg, ref } = useProfilePostsQuery(userId);

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
