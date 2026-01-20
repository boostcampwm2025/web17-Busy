import { getLoggedInUserId } from '@/api';
import { LoginRequestScreen } from '@/components';
import { redirect } from 'next/navigation';

/** 내 프로필(me) 페이지 접근 > 동적 라우트 redirect 역할만 */
export default async function Profile() {
  //const { userId } = await getLoggedInUserId();
  const userId = '11111111-1111-1111-1111-111111111111';

  if (!userId) return <LoginRequestScreen />;

  redirect(`/profile/${userId}`);
}
