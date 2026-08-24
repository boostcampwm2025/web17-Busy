'use client';

import { useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { ConsentType } from '@repo/dto/values';
import { ConsentItemDto } from '@repo/dto';

import { useRecentConsentsQuery } from '@/hooks/privacy/use-recent-consents-query';
import { PrivacyConsentForm } from './PrivacyConsentModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';

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
  const { data, isPending, isError } = useRecentConsentsQuery();

  useEffect(() => {
    if (!isError) return;
    toast.error('동의 정보를 불러오는 데 실패했습니다.');
  }, [isError]);

  /** 폼은 이 값을 첫 렌더에만 읽으므로 조회가 끝난 뒤 마운트되어야 한다. */
  const initialConsentState = useMemo(() => (data ? toConsentState(data.items) : NO_CONSENT), [data]);

  if (isPending) return <LoadingSpinner />;

  return (
    <div className="mx-auto px-8 py-14 max-w-4xl">
      <h1 className="mb-12 text-2xl font-semibold text-center">서비스 이용 약관 확인 및 철회</h1>
      {/* 제출 결과는 mutation이 cache를 무효화해 서버 값으로 다시 받는다. 로컬 state로 복사하지 않는다. */}
      <PrivacyConsentForm submitButtonText="동의 변경하기" initialState={initialConsentState} />
    </div>
  );
}
