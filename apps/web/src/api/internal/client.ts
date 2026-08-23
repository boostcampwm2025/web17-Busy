import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { getAppAccessToken } from '@/api/auth-token';

type AuthMeta = {
  hadAuth: boolean;
  authSig?: string;
};

type AuthedConfig = InternalAxiosRequestConfig & {
  __authMeta?: AuthMeta;
};

const AUTH_ME_PATH = '/user/me';
export const SESSION_EXPIRED_CODE = 'session_expired';

const isAuthMeRequest = (cfg?: AuthedConfig): boolean => {
  const url = cfg?.url ?? '';
  return url === AUTH_ME_PATH || url.endsWith(AUTH_ME_PATH);
};

/**
 * utility 계층인 이 파일이 store/business를 직접 알지 않도록, 세션 만료 처리는
 * 등록된 콜백에 위임한다. 실제 등록은 component 계층(RootClientEffects)이 한다.
 */
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;

export const registerSessionExpiredHandler = (handler: SessionExpiredHandler) => {
  onSessionExpired = handler;
};

/**
 * 토큰 원문을 config에 남기지 않기 위한 "서명"(동일 토큰 여부 체크용)
 */
const makeAuthSig = (token: string): string => {
  const t = token.trim();
  if (!t) return '';

  const head = t.slice(0, 8);
  const tail = t.slice(-8);
  const base = `${t.length}:${head}:${tail}`;

  let hash = 5381;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 33) ^ base.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
};

let handling401 = false;

export const internalClient = axios.create({
  baseURL: '/api',
  timeout: 5000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Request: 토큰 헤더 주입 + authMeta 저장 */
internalClient.interceptors.request.use((config) => {
  const cfg = config as AuthedConfig;

  if (typeof window === 'undefined') return cfg;

  const token = getAppAccessToken();
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
 * Response:
 * - 401: authMe(/user/me)에서만 세션 만료 처리
 * - 기타 API는 각 호출부에서 에러 처리(전역 강제 로그아웃 방지)
 */
internalClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (typeof window === 'undefined') throw error;

    const status = error.response?.status;
    if (status !== 401) throw error;

    const cfg = (error.config ?? {}) as AuthedConfig;

    // 토큰을 붙였던 요청만 세션 만료 후보
    if (!cfg.__authMeta?.hadAuth) throw error;

    // authMe에서만 세션 만료로 정리
    if (!isAuthMeRequest(cfg)) throw error;

    // 요청 당시 토큰과 현재 토큰이 동일할 때만 처리(레이스 방지)
    const currentToken = getAppAccessToken();
    if (!currentToken) throw error;

    const currentSig = makeAuthSig(currentToken);
    const requestSig = cfg.__authMeta.authSig ?? '';
    if (!requestSig || currentSig !== requestSig) throw error;

    if (handling401) throw error;
    handling401 = true;

    onSessionExpired?.();

    window.setTimeout(() => {
      handling401 = false;
    }, 1000);

    throw error;
  },
);
