'use client';

import { useEffect, useState } from 'react';
import { PrivacyConsentForm } from '../modals/PrivacyConsentModal';
import { toast } from 'react-toastify';
import { ConsentType } from '@repo/dto/values';
import LoadingSpinner from '../LoadingSpinner';
import { getRecentConsents } from '@/api';

interface ConsentState {
  terms: boolean;
  privacy: boolean;
}

export default function PrivacyConsentView() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialConsentState, setInitialConsentStates] = useState<ConsentState>({ terms: false, privacy: false });

  const updateInitialConsentState = (newState: ConsentState) => setInitialConsentStates(newState);

  useEffect(() => {
    const fetchConsentStatus = async () => {
      try {
        const { items } = await getRecentConsents();
        setInitialConsentStates((prev) =>
          items.reduce<ConsentState>((acc, { type, agreed }) => {
            if (type === ConsentType.TERMS_OF_SERVICE) acc.terms = agreed;
            if (type === ConsentType.PRIVACY_POLICY) acc.privacy = agreed;
            return acc;
          }, prev),
        );
      } catch (e) {
        console.error(e);
        toast.error('동의 정보를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsentStatus();
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="mx-auto px-8 py-14 max-w-4xl">
      <h1 className="mb-12 text-2xl font-semibold text-center">서비스 이용 약관 확인 및 철회</h1>
      <PrivacyConsentForm onSuccess={updateInitialConsentState} submitButtonText="동의 변경하기" initialState={initialConsentState} />
    </div>
  );
}
