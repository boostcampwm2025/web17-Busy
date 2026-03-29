'use client';

import { usePathname } from 'next/navigation';
import { useState, Suspense, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, ArrowLeft } from 'lucide-react';

import { useNotiStore } from '@/stores/useNotiStore';
import { NotiDrawerContent } from '@/components/noti';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Header() {
  const pathname = usePathname();
  const pageTitle = pathname === '/' ? 'feed' : pathname.split('/')[1];
  const unreadNotiCount = useNotiStore((s) => s.unreadCount);
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // 라우트 변경 시 패널 닫기
  useEffect(() => {
    setIsNotiOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b-2 border-primary px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-black italic tracking-tighter text-primary uppercase">{pageTitle}</h1>

        {/* 모바일 전용 알림 버튼 */}
        <button
          type="button"
          onClick={() => setIsNotiOpen(true)}
          className="lg:hidden relative p-2 rounded-xl border-2 border-transparent hover:bg-gray-4 hover:border-primary transition-all duration-150"
          title="알림"
        >
          <Bell className="w-6 h-6 text-primary" />
          {unreadNotiCount > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 rounded-full bg-accent-pink text-white text-[9px] flex items-center justify-center">
              {unreadNotiCount > 99 ? '99+' : unreadNotiCount}
            </span>
          )}
        </button>
      </header>

      {/* 모바일 알림 풀스크린 오버레이 (오른쪽에서 슬라이드) */}
      {isNotiOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-white flex flex-col animate-slide-in-right">
            <div className="flex items-center gap-3 px-4 py-4 border-b-2 border-primary bg-white/95 backdrop-blur-sm flex-shrink-0">
              <button type="button" onClick={() => setIsNotiOpen(false)} className="p-2 rounded-xl hover:bg-gray-4 text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-black text-primary">알림</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <NotiDrawerContent />
              </Suspense>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
