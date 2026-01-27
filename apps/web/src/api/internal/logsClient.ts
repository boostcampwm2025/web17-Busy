import axios from 'axios';

export const logsClient = axios.create({
  baseURL: '/api', // Next에서 /api -> Nest(/api/*)로 라우팅됨
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
