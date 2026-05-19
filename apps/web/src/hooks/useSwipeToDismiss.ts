'use client';

import { useRef, type RefObject } from 'react';

/**
 * 바텀시트 스와이프 닫기 훅
 * - ref로 DOM을 직접 조작해 re-render 없이 60fps 추적
 * - threshold 이상 내리면 onClose 호출, 미달 시 원위치 복귀
 */
export function useSwipeToDismiss(onClose: () => void, threshold = 100) {
  const startYRef = useRef(0);
  const dragYRef = useRef(0);
  const sheetRef = useRef<HTMLElement>(null) as RefObject<HTMLElement>;

  const applyTransform = (y: number, animated: boolean) => {
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = animated ? 'transform 0.3s ease' : 'none';
    sheetRef.current.style.transform = `translateY(${y}px)`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0]?.clientY ?? 0;
    dragYRef.current = 0;
    // 드래그 시작 시 CSS animation 제거해 transform이 제대로 적용되게 함
    if (sheetRef.current) {
      sheetRef.current.style.animation = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = (e.touches[0]?.clientY ?? 0) - startYRef.current;
    if (delta <= 0) return;
    dragYRef.current = delta;
    applyTransform(delta, false);
  };

  const handleTouchEnd = () => {
    if (dragYRef.current >= threshold) {
      onClose();
    } else {
      applyTransform(0, true);
    }
    dragYRef.current = 0;
  };

  return { sheetRef, handleTouchStart, handleTouchMove, handleTouchEnd };
}
