'use client';

import { useMutation } from '@tanstack/react-query';

import { tmpLogin } from '@/api/internal/auth';
import { setAppAccessToken } from '@/api/auth-token';

/** DEV 전용 시드 로그인. Google 로그인과 동일하게 리로드로 인증 상태를 다시 평가한다. */
export const useTmpLoginMutation = () =>
  useMutation({
    mutationFn: (userId: string) => tmpLogin(userId),
    onSuccess: (appJwt) => {
      setAppAccessToken(appJwt);
      window.location.assign('/');
    },
  });
