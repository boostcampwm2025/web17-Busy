'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUser, getUserProfilePosts } from '@/api';
import { useInfiniteScroll } from '@/hooks';
import { ProfileSkeleton } from '../skeleton';
import ProfileInfo from './ProfileInfo/ProfileInfo';
import ProfilePosts from './ProfilePosts';
import LoadingSpinner from '../LoadingSpinner';
import { GetUserDto } from '@repo/dto';

export default function ProfileView({ userId }: { userId: string }) {
  /** fetch 함수 반환 형식을 무한 스크롤 hook 시그니처에 맞게 변환하는 함수 */
  const fetchProfilePosts = useCallback(
    async (cursor?: string, limit?: number) => {
      const data = await getUserProfilePosts(userId, cursor, limit);
      return data;
    },
    [userId],
  );

  const { items, hasNext, isInitialLoading, errorMsg, ref } = useInfiniteScroll({ fetchFn: fetchProfilePosts });
  const [profileInfo, setProfileInfo] = useState<GetUserDto | null>(null);
  const [renderError, setRenderError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const info = await getUser(userId);
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

  // 프로필 사용자 정보 렌더링 단계에서 발생하는 에러 throw (무한스크롤 에러는 throw 없이 메시지만 표시)
  if (renderError) throw renderError;

  // 최초 요청 처리 중에만 스켈레톤 표시
  if (isInitialLoading || !profileInfo) return <ProfileSkeleton />;

  return (
    <>
      <div className="mx-auto p-6 md:p-10 gap-y-4">
        <ProfileInfo profile={profileInfo} />
        <ProfilePosts posts={items} />
      </div>
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
    </>
  );
}
