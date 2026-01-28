import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { useModalStore, usePlayerStore, useSpotifyAuthStore, useSpotifyPlayerStore, MODAL_TYPES } from '@/stores';

type AuthMeta = {
  hadAuth: boolean;
  authSig?: string;
};

type AuthedConfig = InternalAxiosRequestConfig & {
  __authMeta?: AuthMeta;
};

const AUTH_ME_PATH = '/user/me';
const SESSION_EXPIRED_CODE = 'session_expired';

/** 내 서버용 Axios 인스턴스 */
export const internalClient = axios.create({
  baseURL: '/api',
  timeout: 5000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * 토큰 원문을 config에 남기지 않기 위한 "서명"
 * - 보안 목적의 암호학적 해시가 아니라, "동일 토큰인지" 판별용
 * - 토큰 노출면을 줄이기 위해 token 자체는 저장하지 않는다.
 */
const makeAuthSig = (token: string): string => {
  const t = token.trim();
  if (!t) return '';

  // 토큰 길이 + 앞/뒤 일부만 사용 (원문 전체 노출 방지)
  const head = t.slice(0, 8);
  const tail = t.slice(-8);
  const base = `${t.length}:${head}:${tail}`;

  // 가벼운 해시(djb2 변형) - 동일성 체크용
  let hash = 5381;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 33) ^ base.charCodeAt(i);
  }
  // unsigned
  return (hash >>> 0).toString(16);
};

const getSessionToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY);
};

const isAuthMeRequest = (cfg?: AuthedConfig): boolean => {
  const url = cfg?.url ?? '';
  return url === AUTH_ME_PATH || url.endsWith(AUTH_ME_PATH);
};

const isLoginModalOpen = (): boolean => {
  const s = useModalStore.getState();
  return s.isOpen && s.modalType === MODAL_TYPES.LOGIN;
};

const clearAuthState = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(APP_ACCESS_TOKEN_STORAGE_KEY);
  }
  useSpotifyAuthStore.getState().clear();
  usePlayerStore.getState().clearQueue();
  useSpotifyPlayerStore.getState().reset();
  useModalStore.getState().closeModal();
};

let handling401 = false;

/** Request: 토큰 헤더 주입 + "요청 당시 토큰 서명"만 config에 저장 */
internalClient.interceptors.request.use((config) => {
  const cfg = config as AuthedConfig;

  if (typeof window === 'undefined') return cfg;

  const token = getSessionToken();
  if (!token) {
    cfg.__authMeta = { hadAuth: false };
    return cfg;
  }

  cfg.headers = cfg.headers ?? {};
  cfg.headers.Authorization = `Bearer ${token}`;

  cfg.__authMeta = {
    hadAuth: true,
    authSig: makeAuthSig(token),
  };

  return cfg;
});

/**
 * Response: 401 처리
 * - "authMe(/user/me)"에서만 처리
 * - 요청 당시 토큰(sig)과 현재 토큰(sig)이 같을 때만 처리 (레이스 방지)
 * - 로그인 모달 중복 오픈 방지
 */
internalClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const status = error.response?.status;
    if (status !== 401) return Promise.reject(error);

    const cfg = (error.config ?? {}) as AuthedConfig;

    // 1) 토큰을 붙였던 요청만 "세션 만료 후보"로 본다
    if (!cfg.__authMeta?.hadAuth) return Promise.reject(error);

    // 2) authMe에서만 세션 만료로 정리 (다른 API는 각자 401 처리/에러 UI로)
    if (!isAuthMeRequest(cfg)) return Promise.reject(error);

    // 3) 요청 당시 토큰(sig)과 현재 토큰(sig)이 다르면 레이스로 판단하고 무시
    const currentToken = getSessionToken();
    if (!currentToken) return Promise.reject(error);

    const currentSig = makeAuthSig(currentToken);
    const requestSig = cfg.__authMeta.authSig ?? '';
    if (!requestSig || currentSig !== requestSig) return Promise.reject(error);

    // 4) 중복 처리 방지
    if (handling401) return Promise.reject(error);
    handling401 = true;

    // 5) 만료 처리 + 로그인 모달 오픈 (중복 오픈 방지)
    clearAuthState();

    if (!isLoginModalOpen()) {
      useModalStore.getState().openModal(MODAL_TYPES.LOGIN, { authError: SESSION_EXPIRED_CODE });
    }

    window.setTimeout(() => {
      handling401 = false;
    }, 1000);

    return Promise.reject(error);
  },
);
