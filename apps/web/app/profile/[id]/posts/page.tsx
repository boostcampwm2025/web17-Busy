import { Suspense } from 'react';
import ProfilePostsFeed from '@/components/profile/ProfilePostsFeed';
import LoadingSpinner from '@/components/LoadingSpinner';

export default async function ProfilePostsPage({ params, searchParams }: { params: { id: string }; searchParams: { postId?: string } }) {
  const { id } = await Promise.resolve(params);
  const { postId } = await Promise.resolve(searchParams);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfilePostsFeed userId={id} initialPostId={postId} />
    </Suspense>
  );
}
