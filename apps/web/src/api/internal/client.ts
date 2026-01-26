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
  return url === '/user/me' || url.endsWith('/user/me');
};

internalClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const status = (error as any)?.response?.status;
    if (status !== 401) return Promise.reject(error);

    //  "요청 당시" Authorization을 붙였던 요청만 세션만료로 처리
    const hadAuth = Boolean((error as any)?.config?.__hadAuth);
    if (!hadAuth) return Promise.reject(error);

    // authMe(/user/me)에서만 처리
    if (!isAuthMeRequest(error)) return Promise.reject(error);

    if (handling401) return Promise.reject(error);
    handling401 = true;

    clearAuthState();
    // 이미 로그인 모달이 열려 있으면 중복 오픈 방지
    const modalState = useModalStore.getState();
    const isLoginModalOpen = modalState.isOpen && modalState.modalType === MODAL_TYPES.LOGIN;

    if (!isLoginModalOpen) {
      modalState.openModal(MODAL_TYPES.LOGIN, { authError: 'session_expired' });
    }

    window.setTimeout(() => {
      handling401 = false;
    }, 1000);

    return Promise.reject(error);
  },
);
