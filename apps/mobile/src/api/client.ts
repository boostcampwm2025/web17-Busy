import * as SecureStore from 'expo-secure-store';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const TOKEN_KEY = 'appJwt';

type AuthMeta = {
  hadAuth: boolean;
  authSig?: string;
};

type AuthedConfig = InternalAxiosRequestConfig & {
  __authMeta?: AuthMeta;
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

// 401 처리 중복 방지 플래그
let handling401 = false;

// 세션 만료 시 호출할 콜백 (앱 레이아웃에서 등록)
type OnSessionExpired = () => void;
let onSessionExpired: OnSessionExpired | null = null;

export const setOnSessionExpired = (cb: OnSessionExpired) => {
  onSessionExpired = cb;
};

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const internalClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 5000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Request: 저장된 토큰을 Authorization 헤더에 주입 */
internalClient.interceptors.request.use(async (config) => {
  const cfg = config as AuthedConfig;
  const token = await getToken();

  if (!token) {
    cfg.__authMeta = { hadAuth: false };
    return cfg;
  }

  cfg.headers = cfg.headers ?? {};
  cfg.headers.Authorization = `Bearer ${token}`;
  cfg.__authMeta = { hadAuth: true, authSig: makeAuthSig(token) };

  return cfg;
});

/** Response: 401 세션 만료 처리 */
internalClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    if (status !== 401) throw error;

    const cfg = (error.config ?? {}) as AuthedConfig;
    if (!cfg.__authMeta?.hadAuth) throw error;

    const currentToken = await getToken();
    if (!currentToken) throw error;

    const currentSig = makeAuthSig(currentToken);
    const requestSig = cfg.__authMeta.authSig ?? '';
    if (!requestSig || currentSig !== requestSig) throw error;

    if (handling401) throw error;
    handling401 = true;

    await removeToken();
    onSessionExpired?.();

    setTimeout(() => {
      handling401 = false;
    }, 1000);

    throw error;
  },
);
