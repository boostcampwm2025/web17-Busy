'use client';

import { LoginRequestScreen, ProfileSkeleton } from '@/components';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** 내 프로필(me) 페이지 접근 > 동적 경로로 이동하는 역할만 */
export default function Profile() {
  const router = useRouter();
  const { userId, isLoading } = useAuthMe();

  useEffect(() => {
    if (!isLoading && userId) {
      router.replace(`/profile/${userId}`);
    }
  }, [isLoading, userId, router]);

  // 아직 로그인 여부 모르면 스켈레톤 UI
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // 로그인 안 한 상태 → 로그인 컴포넌트
  if (!userId) {
    return <LoginRequestScreen />;
  }

  // 로그인한 경우 (실제로는 바로 redirect 되기 때문에 거의 안 보임)
  return null;
}
