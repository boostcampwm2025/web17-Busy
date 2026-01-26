'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUser, getUserProfilePosts } from '@/api';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { useInfiniteScroll } from '@/hooks';
import { useFeedRefreshStore, useProfileStore } from '@/stores';
import { ProfileSkeleton } from '../skeleton';
import { ProfileInfo } from './ProfileInfo';
import ProfilePosts from './ProfilePosts';
import LoadingSpinner from '../LoadingSpinner';

export default function ProfileView({ userId }: { userId: string }) {
  const { userId: loggedInUserId } = useAuthMe();
  const { profile, setProfile } = useProfileStore();

  const nonce = useFeedRefreshStore((s) => s.nonce);
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
    fetchFn: fetchProfilePosts,
    resetKey: isMyProfile ? String(nonce) : undefined,
  });
  const [renderError, setRenderError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const info = await getUser(userId);
        setProfile(info);
      } catch (err) {
        console.error('프로필 데이터 fetch 실패', err);
        if (err instanceof Error) {
          setRenderError(err);
        } else {
          setRenderError(new Error('프로필 로딩 중 에러가 발생했습니다.'));
        }
      }
    };

    fetchData();
  }, [userId, setProfile]);

  // 프로필 사용자 정보 렌더링 단계에서 발생하는 에러 throw (무한스크롤 에러는 throw 없이 메시지만 표시)
  if (renderError) throw renderError;

  // 최초 요청 처리 중이거나, 스토어의 프로필 id와 현재 페이지의 프로필 id가 다를 때 스켈레톤 표시
  if (isInitialLoading || !profile || profile.id !== userId) return <ProfileSkeleton />;

  return (
    <div className="h-full flex flex-col mx-auto p-6 md:p-10 gap-y-4">
      <ProfileInfo profile={profile} loggedInUserId={loggedInUserId} />
      <ProfilePosts posts={items} isMyProfile={isMyProfile} />
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
