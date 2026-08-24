'use client';

import { MODAL_TYPES, useModalStore } from '@/stores';
import { BadgeAlert } from 'lucide-react';

export default function LoginRequestScreen() {
  const openModal = useModalStore((s) => s.openModal);

  const handleOpenLoginModal = () => openModal(MODAL_TYPES.LOGIN);

  return (
    <div className="h-full flex flex-col justify-center items-center">
      <BadgeAlert className="h-24 w-24" />
      <h2 className="text-2xl font-bold mt-8 mb-12">로그인이 필요합니다.</h2>
      <button
        title="로그인"
        onClick={handleOpenLoginModal}
        className="bg-accent-yellow px-6 py-4 font-medium rounded-lg hover:bg-amber-300 transition-colors duration-200"
      >
        로그인하러 가기
      </button>
    </div>
  );
}
