import axios from 'axios';
import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';

export const logsClient = axios.create({
  baseURL: '/api', // Next에서 /api -> Nest(/api/*)로 라우팅됨
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 중요:
 * - logsClient에는 "로깅 인터셉터"를 달지 않는다(무한 루프 위험).
 * - 대신 user_id를 채우기 위해, 로그인 상태에서는 Authorization만 주입한다.
 */
logsClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;

  const token = sessionStorage.getItem(APP_ACCESS_TOKEN_STORAGE_KEY);
  if (!token) return config;

  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
