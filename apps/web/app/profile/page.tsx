'use client';

import { LoadingSpinner, LoginRequestScreen } from '@/components';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** 내 프로필(me) 페이지 접근 > 동적 경로로 이동하는 역할만 */
export default function Profile() {
  const router = useRouter();
  const { userId } = useAuthMe();

  useEffect(() => {
    userId && router.push(`/profile/${userId}`);
  }, [userId]);

  return userId ? <LoadingSpinner /> : <LoginRequestScreen />;
}
