import { getLoggedInUserId, getUserProfileInfo, getUserProfilePosts } from '@/api';
import { LoginRequestScreen, ProfileInfo, ProfilePosts } from '@/components';

/** 내 프로필(me) 페이지 */
export default async function Profile() {
  //const { userId } = await getLoggedInUserId();
  const userId = '11111111-1111-1111-1111-111111111111';

  if (!userId) return <LoginRequestScreen />;

  // 내 프로필 정보 fetch
  const profileInfo = await getUserProfileInfo(userId);
  const profilePosts = await getUserProfilePosts(userId);

  return (
    <div className="mx-auto p-6 md:p-10 gap-y-4">
      <ProfileInfo profile={profileInfo} isMyProfile={true} />
      <ProfilePosts posts={profilePosts} />
    </div>
  );
}
