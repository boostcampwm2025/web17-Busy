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
