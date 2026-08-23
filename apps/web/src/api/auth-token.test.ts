import { beforeEach, describe, expect, it } from 'vitest';

import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';

import { clearAppAccessToken, getAppAccessToken, setAppAccessToken } from './auth-token';

describe('auth token storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('reads back what it wrote', () => {
    setAppAccessToken('app-jwt-token');

    expect(getAppAccessToken()).toBe('app-jwt-token');
  });

  it('returns null when no token is stored', () => {
    expect(getAppAccessToken()).toBeNull();
  });

  it('removes the token on clear', () => {
    setAppAccessToken('app-jwt-token');

    clearAppAccessToken();

    expect(getAppAccessToken()).toBeNull();
  });

  /** 기존에 저장된 평문 토큰을 그대로 읽어야 로그인 세션이 유지된다. */
  it('reads the token written directly under the shared storage key', () => {
    sessionStorage.setItem(APP_ACCESS_TOKEN_STORAGE_KEY, 'existing-token');

    expect(getAppAccessToken()).toBe('existing-token');
  });
});
