import { getUserProfileInfo, getUserProfilePosts } from '@/api';
import { ProfileInfo, ProfilePosts } from '@/components';

export default async function Profile({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params);

  const profileInfo = await getUserProfileInfo(id);
  const profilePosts = await getUserProfilePosts(id);

  return (
    <div className="mx-auto p-6 md:p-10 gap-y-4">
      <ProfileInfo profile={profileInfo} isMyProfile={true} />
      <ProfilePosts posts={profilePosts} />
    </div>
  );
}
