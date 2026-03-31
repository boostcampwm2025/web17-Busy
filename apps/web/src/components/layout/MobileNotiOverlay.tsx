'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useNotiOverlayStore } from '@/stores/useNotiOverlayStore';
import { NotiDrawerContent } from '@/components/noti';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function MobileNotiOverlay() {
  const { isOpen, close } = useNotiOverlayStore();
  const [isVisible, setIsVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isAnimatingClose = useRef(false);
  const isVisibleRef = useRef(isVisible);
  const pathname = usePathname();

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  // 스토어 참조를 ref로 유지 (클로저 stale 방지)
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  const snapClose = () => {
    if (isAnimatingClose.current) return;
    isAnimatingClose.current = true;
    if (panelRef.current) {
      panelRef.current.style.transition = 'transform 0.3s ease-out';
      panelRef.current.style.transform = 'translateX(100%)';
    }
    setTimeout(() => {
      closeRef.current();
      setIsVisible(false);
      isAnimatingClose.current = false;
    }, 300);
  };
  const snapCloseRef = useRef(snapClose);
  snapCloseRef.current = snapClose;

  // 라우트 변경 시 닫기
  useEffect(() => {
    if (isVisibleRef.current) snapCloseRef.current();
  }, [pathname]);

  useEffect(() => {
    const onPopState = () => {
      if (isVisibleRef.current) snapCloseRef.current();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisibleRef.current) snapCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // 스토어에서 isOpen = true가 되면 (벨 버튼 클릭) 패널 애니메이션 열기
  useEffect(() => {
    if (isOpen && !isVisibleRef.current) {
      setIsVisible(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (panelRef.current) {
            panelRef.current.style.transition = 'transform 0.3s ease-out';
            panelRef.current.style.transform = 'translateX(0)';
          }
        }),
      );
    }
  }, [isOpen]);

  // 패널 터치: 오른쪽 스와이프 → 닫기
  const closeGesture = useRef({ startX: 0, startY: 0, isHorizontal: null as boolean | null });

  const handlePanelTouchStart = (e: React.TouchEvent) => {
    closeGesture.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      isHorizontal: null,
    };
  };

  const handlePanelTouchMove = (e: React.TouchEvent) => {
    const { startX, startY } = closeGesture.current;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    if (closeGesture.current.isHorizontal === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      closeGesture.current.isHorizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (!closeGesture.current.isHorizontal) return;

    const clamped = Math.max(0, dx);
    if (panelRef.current) {
      panelRef.current.style.transition = 'none';
      panelRef.current.style.transform = `translateX(${clamped}px)`;
    }
  };

  const handlePanelTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - closeGesture.current.startX;
    if (dx > window.innerWidth * 0.3) {
      snapCloseRef.current();
    } else {
      if (panelRef.current) {
        panelRef.current.style.transition = 'transform 0.3s ease-out';
        panelRef.current.style.transform = 'translateX(0)';
      }
    }
  };

  if (!isVisible) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed inset-0 z-[9999] bg-white flex flex-col"
      style={{ transform: 'translateX(100%)' }}
      onTouchStart={handlePanelTouchStart}
      onTouchMove={handlePanelTouchMove}
      onTouchEnd={handlePanelTouchEnd}
    >
      <div className="flex items-center gap-3 px-4 py-4 border-b-2 border-primary bg-white/95 backdrop-blur-sm flex-shrink-0">
        <button type="button" onClick={() => snapCloseRef.current()} className="p-2 rounded-xl hover:bg-gray-4 text-primary transition-colors">
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
  );
}
