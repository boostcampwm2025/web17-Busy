import axios from 'axios';
import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';

export const logsClient = axios.create({
  baseURL: '/api',
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * /api/logs는 AuthGuard(로그인 전용) 이므로,
 * 토큰이 없으면 요청을 보내지 않도록 방어.
 */
logsClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;

  const token = sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY);
  if (!token) {
    // 로그인 전용 정책: 토큰 없으면 요청 취소
    return Promise.reject(new Error('Missing appJwt for /api/logs'));
  }

  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
