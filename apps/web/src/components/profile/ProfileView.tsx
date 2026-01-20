'use client';

import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { getUserProfileInfo, getUserProfilePosts } from '@/api';
import { useInfiniteScroll } from '@/hooks';
import { ProfileSkeleton } from '../skeleton';
import ProfileInfo from './ProfileInfo/ProfileInfo';
import ProfilePosts from './ProfilePosts';
import ErrorScreen from '../ErrorScreen';
import LoadingSpinner from '../LoadingSpinner';

// TODO: dto로 대체
interface ProfileInfo {
  userId: string;
  nickname: string;
  profileImgUrl: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export default function ProfileView({ userId }: { userId: string }) {
  /** fetch 함수 반환 형식을 무한 스크롤 hook 시그니처에 맞게 변환하는 함수 */
  const fetchProfilePosts = useCallback(
    async (cursor?: string, limit?: number) => {
      const data = await getUserProfilePosts(userId, cursor, limit);
      return data;
    },
    [userId],
  );

  const { items, hasNext, initLoadedRef, error: scrollErrorMsg, ref } = useInfiniteScroll({ fetchFn: fetchProfilePosts });
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [renderError, setRenderError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const info = await getUserProfileInfo(userId);
        setProfileInfo(info);
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
  }, [userId]);

  if (renderError) throw renderError;

  if (!initLoadedRef.current || !profileInfo) return <ProfileSkeleton />;

  return (
    <ErrorBoundary FallbackComponent={ErrorScreen}>
      <div className="mx-auto p-6 md:p-10 gap-y-4">
        <ProfileInfo profile={profileInfo} />
        <ProfilePosts posts={items} />
      </div>
      {scrollErrorMsg && (
        <div className="text-center">
          <p>{scrollErrorMsg}</p>
          <p className="text-sm mt-2">다시 시도해주세요.</p>
        </div>
      )}
      {hasNext && (
        <div ref={ref}>
          <LoadingSpinner hStyle="py-6" />
        </div>
      )}
    </ErrorBoundary>
  );
}
