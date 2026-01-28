'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { privacyConsent } from '@/api';
import { usePrivacyAgreements } from './usePrivacyAgreements';
import { AgreementItem } from './AgreeItem';
import { ConsentType, UpdateConsentListDto } from '@repo/dto';

interface PrivacyConsentFormProps {
  onSuccess?: () => void;
  submitButtonText?: string;
}

export const PrivacyConsentForm = ({ onSuccess, submitButtonText = '동의하고 시작하기' }: PrivacyConsentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { agreements, handleCheck, handleAllCheck, isRequiredChecked } = usePrivacyAgreements();

  const handleSubmit = async () => {
    if (!isRequiredChecked || isLoading) return;
    try {
      setIsLoading(true);

      const payload: UpdateConsentListDto = {
        items: [
          {
            type: ConsentType.TERMS_OF_SERVICE, // 'TERMS'
            agreed: agreements.terms,
          },
          {
            type: ConsentType.PRIVACY_POLICY, // 'PRIVACY'
            agreed: agreements.privacy,
          },
        ],
      };
      await privacyConsent(payload);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('동의 실패, 다시 시도해주세요');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 전체 동의 섹션 */}
      <div
        onClick={handleAllCheck}
        className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-primary/20 bg-primary/5 cursor-pointer transition-all active:scale-[0.98]"
      >
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${Object.values(agreements).every(Boolean) ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
        <span className="font-bold text-primary text-lg">약관 전체 동의</span>
      </div>

      {/* 개별 항목 섹션 */}
      <div className="flex flex-col gap-3">
        <AgreementItem label="[필수] 이용약관 동의" checked={agreements.terms} onChange={() => handleCheck('terms')} />
        <div className="h-32 overflow-y-auto bg-gray-50 p-3 rounded-lg text-[10px] text-gray-400 border border-gray-200 leading-relaxed">
          제 1조 (목적) ... 여기에 실제 이용약관 텍스트 내용이 길어지면 자동으로 스크롤바가 생깁니다.
        </div>

        <AgreementItem label="[필수] 개인정보 수집 및 이용" checked={agreements.privacy} onChange={() => handleCheck('privacy')} />
        <div className="h-32 overflow-y-auto bg-gray-50 p-3 rounded-lg text-[10px] text-gray-400 border border-gray-200 leading-relaxed">
          개인정보 보호법에 의거하여 ... 여기에 수집 항목 및 목적을 입력하세요.
        </div>
      </div>

      {/* 제출 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!isRequiredChecked || isLoading}
        className={`w-full py-4 rounded-xl font-black transition-all border-2 border-primary ${
          isRequiredChecked ? 'bg-primary text-white shadow-[4px_4px_0px_0px_#000000]' : 'bg-gray-100 text-gray-400 border-gray-300'
        }`}
      >
        {isLoading ? '로딩 중...' : submitButtonText}
      </button>
    </div>
  );
};
