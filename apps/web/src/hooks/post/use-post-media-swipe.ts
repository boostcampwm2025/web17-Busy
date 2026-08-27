'use client';

import { useEffect, useRef, useState } from 'react';

/** 슬라이드 애니메이션 길이. CSS transition과 인덱스 이동 타이머가 같은 값을 써야 한다. */
export const TRANSITION_MS = 250;

/** 이 거리보다 짧으면 스와이프가 아니라 탭으로 본다. */
const TAP_THRESHOLD_PX = 5;

/** 컨테이너 폭의 이 비율만큼 끌어야 슬라이드가 넘어간다. */
const SWIPE_RATIO = 0.3;

/** offsetWidth를 못 읽는 환경(레이아웃 계산 전)에서 쓰는 폭. */
const FALLBACK_WIDTH_PX = 300;

type Params = {
  isMulti: boolean;
  activeIndex: number;
  totalLength: number;
  onPrev: () => void;
  onNext: () => void;
  onClickContainer?: () => void;
};

/** 좌우 스와이프로 슬라이드를 넘기는 상태. 어떤 이미지를 보여줄지는 모른다. */
export function usePostMediaSwipe({ isMulti, activeIndex, totalLength, onPrev, onNext, onClickContainer }: Params) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef(0);
  const wasSwipeRef = useRef(false); // 스와이프였으면 click 방지
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 전환 도중 언마운트되면(모달 닫기 등) 타이머가 사라진 컴포넌트의 state를 건드린다.
  useEffect(
    () => () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    },
    [],
  );

  /** 슬라이드 애니메이션이 끝난 뒤 인덱스를 옮기고 트랙을 원위치시킨다. */
  const finishTransition = (advance?: () => void) => {
    transitionTimerRef.current = setTimeout(() => {
      transitionTimerRef.current = null;
      advance?.();
      setIsTransitioning(false);
      setDragOffset(0);
    }, TRANSITION_MS);
  };

  const handleContainerClick = () => {
    if (wasSwipeRef.current) return;
    onClickContainer?.();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMulti || isTransitioning) return;
    touchStartXRef.current = e.touches[0]?.clientX ?? 0;
    wasSwipeRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMulti || isTransitioning) return;
    const delta = (e.touches[0]?.clientX ?? 0) - touchStartXRef.current;
    if (Math.abs(delta) > TAP_THRESHOLD_PX) wasSwipeRef.current = true;
    // 경계에서 해당 방향 스와이프 막기
    if (activeIndex <= 0 && delta > 0) return;
    if (activeIndex >= totalLength - 1 && delta < 0) return;
    setDragOffset(delta);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // 전환 중에는 touchStart가 건너뛰어져 touchStartX가 직전 스와이프 값 그대로다.
    // 그 값으로 delta를 재면 임계값을 넘겨 한 번의 스와이프가 두 칸을 넘긴다.
    if (!isMulti || isTransitioning) return;

    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
    const containerWidth = containerRef.current?.offsetWidth || FALLBACK_WIDTH_PX;
    const threshold = containerWidth * SWIPE_RATIO;

    // 짧은 탭은 스와이프 처리 안 함
    if (Math.abs(delta) < TAP_THRESHOLD_PX) {
      setDragOffset(0);
      return;
    }

    setIsTransitioning(true);

    const isAtStart = activeIndex <= 0;
    const isAtEnd = activeIndex >= totalLength - 1;

    if (delta < -threshold && !isAtEnd) {
      // 왼쪽 스와이프 → 다음
      setDragOffset(-containerWidth);
      finishTransition(onNext);
    } else if (delta > threshold && !isAtStart) {
      // 오른쪽 스와이프 → 이전
      setDragOffset(containerWidth);
      finishTransition(onPrev);
    } else {
      // 임계값 미달 → 제자리 복귀
      setDragOffset(0);
      finishTransition();
    }
  };

  // 트랙 스타일: [이전, 현재, 다음]을 나란히, translateX로 현재 이미지를 중앙에 표시
  const trackStyle: React.CSSProperties = {
    transform: `translateX(calc(-33.333% + ${dragOffset}px))`,
    transition: isTransitioning ? `transform ${TRANSITION_MS}ms ease-out` : 'none',
  };

  return { containerRef, trackStyle, handleContainerClick, handleTouchStart, handleTouchMove, handleTouchEnd };
}
