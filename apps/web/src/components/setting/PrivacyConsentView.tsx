'use client';

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ConsentType } from '@repo/dto/values';
import { ConsentItemDto } from '@repo/dto';

import { queryKeys } from '@/api';
import { useRecentConsentsQuery } from '@/hooks';
import { PrivacyConsentForm } from '../modals/PrivacyConsentModal';
import LoadingSpinner from '../LoadingSpinner';

interface ConsentState {
  terms: boolean;
  privacy: boolean;
}

const NO_CONSENT: ConsentState = { terms: false, privacy: false };

const toConsentState = (items: ConsentItemDto[]) =>
  items.reduce<ConsentState>(
    (acc, { type, agreed }) => {
      if (type === ConsentType.TERMS_OF_SERVICE) acc.terms = agreed;
      if (type === ConsentType.PRIVACY_POLICY) acc.privacy = agreed;
      return acc;
    },
    { ...NO_CONSENT },
  );

export default function PrivacyConsentView() {
  const queryClient = useQueryClient();
  const { data, isPending, isError } = useRecentConsentsQuery();

  useEffect(() => {
    if (!isError) return;
    toast.error('동의 정보를 불러오는 데 실패했습니다.');
  }, [isError]);

  /** 폼은 이 값을 첫 렌더에만 읽으므로 조회가 끝난 뒤 마운트되어야 한다. */
  const initialConsentState = useMemo(() => (data ? toConsentState(data.items) : NO_CONSENT), [data]);

  /** 로컬 state로 복사하지 않는다. 제출 결과는 cache를 무효화해 서버 값으로 다시 받는다. */
  const handleSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.consents.recent });
  };

  if (isPending) return <LoadingSpinner />;

  return (
    <div className="mx-auto px-8 py-14 max-w-4xl">
      <h1 className="mb-12 text-2xl font-semibold text-center">서비스 이용 약관 확인 및 철회</h1>
      <PrivacyConsentForm onSuccess={handleSuccess} submitButtonText="동의 변경하기" initialState={initialConsentState} />
    </div>
  );
}
