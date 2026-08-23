import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';

import { internalClient, registerSessionExpiredHandler } from './client';

/** 어떤 요청이든 401로 응답하는 어댑터. */
const respondWith401 = (config: InternalAxiosRequestConfig) => {
  const response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config };
  return Promise.reject(new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, null, response));
};

describe('internalClient 401 handling', () => {
  beforeEach(() => {
    sessionStorage.clear();
    internalClient.defaults.adapter = respondWith401;
  });

  it('does not call the handler when the request carried no token', async () => {
    const handler = vi.fn();
    registerSessionExpiredHandler(handler);

    await expect(internalClient.get('/user/me')).rejects.toBeInstanceOf(AxiosError);

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call the handler for a 401 outside of authMe', async () => {
    sessionStorage.setItem(APP_ACCESS_TOKEN_STORAGE_KEY, 'app-jwt-token');
    const handler = vi.fn();
    registerSessionExpiredHandler(handler);

    await expect(internalClient.get('/post/1')).rejects.toBeInstanceOf(AxiosError);

    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * 이 파일(utility 계층)은 세션 정리/모달 오픈 방법을 모른다.
   * RootClientEffects가 등록한 핸들러를 호출할 뿐이라는 것만 검증한다.
   *
   * NOTE: 이 경로는 모듈 수준 handling401 플래그를 1초간 세우므로 마지막에 둔다.
   */
  it('calls the registered handler exactly once when authMe returns 401', async () => {
    sessionStorage.setItem(APP_ACCESS_TOKEN_STORAGE_KEY, 'app-jwt-token');
    const handler = vi.fn();
    registerSessionExpiredHandler(handler);

    await expect(internalClient.get('/user/me')).rejects.toBeInstanceOf(AxiosError);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
