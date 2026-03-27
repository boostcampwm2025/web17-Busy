'use client';

import { usePathname } from 'next/navigation';
import { useState, Suspense, useEffect } from 'react';
import { Bell } from 'lucide-react';

import { useNotiStore } from '@/stores/useNotiStore';
import { NotiDrawerContent } from '@/components/noti';
import LoadingSpinner from '@/components/LoadingSpinner';
import MobileBottomSheet from './MobileBottomSheet';

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

      <MobileBottomSheet isOpen={isNotiOpen} title="알림" onClose={() => setIsNotiOpen(false)}>
        <Suspense fallback={<LoadingSpinner />}>
          <NotiDrawerContent />
        </Suspense>
      </MobileBottomSheet>
    </>
  );
}
