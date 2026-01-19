import { getLoggedInUserId, getUserProfileInfo, getUserProfilePosts } from '@/api';
import LoginRequestScreen from '@/components/LoginRequestScreen';

/** 내 프로필(me) 페이지 */
export default async function Profile() {
  //const { userId } = await getLoggedInUserId();
  const userId = '11111111-1111-1111-1111-111111111111';

  if (!userId) return <LoginRequestScreen />;

  // 내 프로필 정보 fetch
  const profileInfo = await getUserProfileInfo(userId);
  const ProfilePosts = await getUserProfilePosts(userId);

  return (
    <div className="flex h-full justify-center items-center">
      <p className="text-xl">프로필 페이지 영역</p>
    </div>
  );
}
