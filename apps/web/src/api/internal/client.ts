import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';
//import { clearGuestQueueSession } from '@/hooks';
import { useModalStore, usePlayerStore, useSpotifyAuthStore, useSpotifyPlayerStore, MODAL_TYPES } from '@/stores';
import axios from 'axios';

// 내 서버용 Axios 인스턴스
export const internalClient = axios.create({
  baseURL: '/api', // Next.js Rewrites나 Proxy를 쓴다면 '/api'를 기본으로 잡습니다.
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

internalClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const appJwt = sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY);
    if (appJwt) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${appJwt}`;
    }
  }
  return config;
});

let handling401 = false;

const clearAuthState = () => {
  /** 1) 토큰 제거 */
  sessionStorage.removeItem(APP_ACCESS_TOKEN_STORAGE_KEY);

  /** 2) FE 상태 초기화 */
  useSpotifyAuthStore.getState().clear();
  usePlayerStore.getState().clearQueue();
  useSpotifyPlayerStore.getState().reset();
  useModalStore.getState().closeModal();
  //clearGuestQueueSession();
};

const isAuthMeRequest = (error: unknown): boolean => {
  const url = (error as any)?.config?.url as string | undefined;
  if (!url) return false;

  // authMe()는 internalClient.get('/user/me')를 호출함
  // baseURL이 '/api'라 config.url은 '/user/me' 형태
  return url === '/user/me' || url.endsWith('/user/me');
};

internalClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;

    if (typeof window === 'undefined') return Promise.reject(error);
    if (status !== 401) return Promise.reject(error);

    // 토큰 없으면: "비로그인"으로 간주하고 전역 처리는 하지 않는다
    const hasToken = Boolean(sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY));
    if (!hasToken) return Promise.reject(error);

    // authMe(/user/me)에서만 "세션 만료"로 판단하고 정리
    if (!isAuthMeRequest(error)) return Promise.reject(error);

    if (handling401) return Promise.reject(error);
    handling401 = true;

    clearAuthState();

    // UX: 로그인 모달 오픈
    useModalStore.getState().openModal(MODAL_TYPES.LOGIN, { authError: 'session_expired' });

    // 중복 오픈 방지로 1초 여유
    window.setTimeout(() => {
      handling401 = false;
    }, 1000);

    return Promise.reject(error);
  },
);
