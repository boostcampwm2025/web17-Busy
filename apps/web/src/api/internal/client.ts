import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { useModalStore, usePlayerStore, useSpotifyAuthStore, useSpotifyPlayerStore, MODAL_TYPES } from '@/stores';
import { enqueueLog } from '@/utils/logQueue';
import type { LogEventDto } from '@repo/dto';

import { buildLogMeta, getOrCreateSessionId, normalizeMethod, normalizePath, nowMs, type LogMeta } from './logging';

type AuthMeta = {
  hadAuth: boolean;
  authSig?: string;
};

type AuthedConfig = InternalAxiosRequestConfig & {
  __authMeta?: AuthMeta;
  __logMeta?: LogMeta;
};

const AUTH_ME_PATH = '/user/me';
const SESSION_EXPIRED_CODE = 'session_expired';

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

const getSessionToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY);
};

let handling401 = false;

export const internalClient = axios.create({
  baseURL: '/api',
  timeout: 5000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Request: logMeta 계산 + 토큰 주입 + authMeta 저장 */
internalClient.interceptors.request.use((config) => {
  const cfg = config as AuthedConfig;

  // logging meta
  if (typeof window !== 'undefined') {
    cfg.__logMeta = buildLogMeta(cfg);
  }

  // auth meta
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
 * Response:
 * - 2xx: eligible 요청이면 enqueueLog
 * - 401: authMe 세션 만료 처리
 */
internalClient.interceptors.response.use(
  (res) => {
    const cfg = (res.config ?? {}) as AuthedConfig;

    if (typeof window !== 'undefined' && cfg.__logMeta?.eligible) {
      const meta = cfg.__logMeta;
      const method = normalizeMethod(cfg.method);
      const path = normalizePath(cfg.url);

      const durationMs = Math.max(0, Math.round(nowMs() - meta.startAt));
      const statusCode = res.status;

      const sessionId = getOrCreateSessionId();

      const event: LogEventDto = {
        eventType: meta.eventType ?? 'API_MUTATION',
        source: 'fe_api',
        sessionId,
        method,
        path,
        statusCode,
        durationMs,
        targetPostId: meta.targets?.postId,
        targetUserId: meta.targets?.userId,
        meta: meta.meta,
      };

      enqueueLog(event);
    }

    return res;
  },
  async (error: AxiosError) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const status = error.response?.status;

    if (status === 401) {
      const cfg = (error.config ?? {}) as AuthedConfig;

      if (!cfg.__authMeta?.hadAuth) return Promise.reject(error);
      if (!isAuthMeRequest(cfg)) return Promise.reject(error);

      const currentToken = getSessionToken();
      if (!currentToken) return Promise.reject(error);

      const currentSig = makeAuthSig(currentToken);
      const requestSig = cfg.__authMeta.authSig ?? '';
      if (!requestSig || currentSig !== requestSig) return Promise.reject(error);

      if (handling401) return Promise.reject(error);
      handling401 = true;

      clearAuthState();

      if (!isLoginModalOpen()) {
        useModalStore.getState().openModal(MODAL_TYPES.LOGIN, { authError: SESSION_EXPIRED_CODE });
      }

      window.setTimeout(() => {
        handling401 = false;
      }, 1000);

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);
