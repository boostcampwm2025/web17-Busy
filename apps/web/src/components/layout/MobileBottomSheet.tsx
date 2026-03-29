'use client';

import { PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type MobileBottomSheetProps = PropsWithChildren<{
  isOpen: boolean;
  title: string;
  onClose: () => void;
  className?: string;
}>;

export default function MobileBottomSheet({ isOpen, title, onClose, className, children }: MobileBottomSheetProps) {
  if (!isOpen) return null;

  return createPortal(
    <>
      {/* 배경 딤 */}
      <div className="fixed inset-0 bg-primary/20 backdrop-blur-[2px] z-[10001] animate-fade-in" onClick={onClose} />

      {/* 시트 */}
      <section
        className={`fixed inset-x-0 bottom-0 z-[10002] bg-white rounded-t-2xl border-t-2 border-x-2 border-primary flex flex-col animate-slide-up ${className ?? ''}`}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-3" />
        </div>

        {/* 타이틀 + 닫기 */}
        <div className="flex items-center px-6 py-3 border-b-2 border-primary/10 flex-shrink-0">
          <h2 className="text-xl font-black text-primary flex-1">{title}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-4 text-primary transition-colors" title="닫기">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
      </section>
    </>,
    document.body,
  );
}
