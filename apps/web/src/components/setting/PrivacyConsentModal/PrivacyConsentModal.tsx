'use client';

import { useModalStore } from '@/stores/useModalStore';
import { CloseButton } from '@/components/common/CloseButton';
import { ModalShell } from '@/components/common/ModalShell';
import { PrivacyConsentForm } from './PrivacyConsentForm';

export const PrivacyConsentModal = () => {
  const handleClose = useModalStore((s) => s.closeModal);

  return (
    // 동의는 명시적으로 받아야 하므로 배경을 눌러 넘어가지 못하게 한다.
    <ModalShell onClose={handleClose} size="lg" closeOnBackdrop={false}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary">
        <h2 className="text-xl font-black text-primary">약관 동의</h2>
        <CloseButton onClose={handleClose} />
      </div>

      {/* 바디 - 분리된 폼 호출 */}
      <div className="px-6 py-8">
        <PrivacyConsentForm onSuccess={handleClose} />
      </div>
    </ModalShell>
  );
};
