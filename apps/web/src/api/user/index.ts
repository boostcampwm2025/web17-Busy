import { MOCK_PROFILE, MOCK_PROFILE_POSTS } from '@/constants';

/** [GET] 서버 컴포넌트에서 로그인 정보 요청 */
export const getLoggedInUserId = async (): Promise<{ userId: string | null }> => {
  const res = await fetch(`${process.env.INTERNAL_API_URL}/user/me`, { cache: 'no-store' });

  // 로그인 인증 안 된 경우 예외 처리
  if (!res.ok && res.status === 401) {
    return { userId: null };
  }

  // 그 외 실패 응답은 에러 throw
  if (!res.ok) {
    throw new Error(`로그인 여부 확인에 실패했습니다: ${res.status}`);
  }

  return { userId: (await res.json()).userId };
};

/** [GET] 서버 컴포넌트에서 사용자 프로필 정보 요청 */
export const getUserProfileInfo = async (userId: string) => {
  return MOCK_PROFILE; // TODO: 실제 API 연동
};

/** [GET] 서버 컴포넌트에서 사용자 프로필 게시물 목록 요청 */
export const getUserProfilePosts = async (userId: string) => {
  return MOCK_PROFILE_POSTS; // TODO: 실제 API 연동
};
