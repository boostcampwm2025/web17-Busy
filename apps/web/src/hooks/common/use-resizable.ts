'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ResizeDirection = 'left' | 'right';

type UseResizableOptions = {
  /** 초기 너비(px). SSR/첫 렌더는 항상 이 값을 사용 */
  defaultWidth: number;
  /** 최소 너비(px) */
  min: number;
  /** 최대 너비(px) */
  max: number;
  /**
   * 드래그로 잡는 가장자리.
   * - 'right': 패널의 오른쪽 끝을 잡음(오른쪽으로 끌면 넓어짐) → 좌측 드로어
   * - 'left' : 패널의 왼쪽 끝을 잡음(왼쪽으로 끌면 넓어짐) → 우측 패널
   */
  direction: ResizeDirection;
  /** 있으면 localStorage에 너비 영속화 */
  storageKey?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * 패널 너비를 마우스/터치 드래그로 조절하는 훅.
 * - Pointer Events + setPointerCapture로 마우스/터치/펜 통합 추적
 * - 드래그 중 body의 user-select/cursor를 제어해 텍스트 선택 방지
 * - storageKey가 있으면 너비를 localStorage에 저장하고 마운트 후 복원(hydration 안전)
 */
export function useResizable({ defaultWidth, min, max, direction, storageKey }: UseResizableOptions) {
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);

  // 드래그 종료 시 최신 너비를 저장하기 위해 ref로 추적
  const widthRef = useRef(width);
  widthRef.current = width;

  // 마운트 후 저장값 복원 (첫 렌더는 defaultWidth → hydration mismatch 방지)
  useEffect(() => {
    if (!storageKey) return;
    const saved = Number(localStorage.getItem(storageKey));
    if (saved) setWidth(clamp(saved, min, max));
  }, [storageKey, min, max]);

  // 드래그 중 텍스트 선택/커서 제어 (useScrollLock과 동일하게 effect에서 body 조작)
  useEffect(() => {
    if (!isDragging) return;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = widthRef.current;

      (e.target as Element).setPointerCapture(e.pointerId);
      setIsDragging(true);

      const onMove = (ev: PointerEvent) => {
        const delta = ev.clientX - startX;
        const next = direction === 'right' ? startWidth + delta : startWidth - delta;
        setWidth(clamp(next, min, max));
      };

      const onUp = () => {
        setIsDragging(false);
        if (storageKey) localStorage.setItem(storageKey, String(widthRef.current));
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [direction, min, max, storageKey],
  );

  return { width, isDragging, onPointerDown };
}
