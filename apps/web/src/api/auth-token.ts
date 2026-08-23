import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';

/**
 * 앱 액세스 토큰(appJwt)의 유일한 접근 경로.
 * 토큰을 구독하는 화면은 없고 로그인 직후 전체 리로드로 인증 상태를 다시 평가하므로,
 * 반응성 없는 sessionStorage 래퍼로 둔다.
 */
export const getAppAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY);
};

export const setAppAccessToken = (token: string) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(APP_ACCESS_TOKEN_STORAGE_KEY, token);
};

export const clearAppAccessToken = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(APP_ACCESS_TOKEN_STORAGE_KEY);
};
