'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateConsentListDto } from '@repo/dto';

import { updatePrivacyConsent } from '@/api/internal/privacy';
import { queryKeys } from '@/api/queryKeys';

/**
 * 약관 동의 제출. 동의 내역 조회는 staleTime이 길어 무효화하지 않으면
 * 제출 직후에도 설정 화면과 시작 시 gate가 예전 동의 상태를 그대로 읽는다.
 */
export const useUpdatePrivacyConsentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateConsentListDto) => updatePrivacyConsent(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.consents.recent });
    },
  });
};
