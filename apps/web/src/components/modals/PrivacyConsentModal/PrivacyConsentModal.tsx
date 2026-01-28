'use client';

import { useModalStore } from '@/stores/useModalStore';
import { X } from 'lucide-react';
import { PrivacyConsentForm } from './PrivacyConsentForm';

export const PrivacyConsentModal = () => {
  const { closeModal } = useModalStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl border-2 border-primary shadow-[8px_8px_0px_0px_var(--color-primary)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary">
          <h2 className="text-xl font-black text-primary">약관 동의</h2>
          <button onClick={closeModal}>
            <X className="w-6 h-6 text-primary" />
          </button>
        </div>

        {/* 바디 - 분리된 폼 호출 */}
        <div className="px-6 py-8">
          <PrivacyConsentForm onSuccess={closeModal} />
        </div>
      </div>
    </div>
  );
};
