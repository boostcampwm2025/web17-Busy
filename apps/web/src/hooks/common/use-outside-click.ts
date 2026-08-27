'use client';

import { useEffect, useRef, type RefObject } from 'react';

type Options = {
  /** 닫혀 있을 때는 리스너를 붙이지 않는다. */
  enabled?: boolean;
  /**
   * `mousedown`은 누르는 순간, `click`은 떼는 순간 닫는다.
   * 안쪽에서 눌러 바깥에서 떼는 드래그가 있는 UI라면 `click`이어야 오작동하지 않는다.
   */
  eventType?: 'mousedown' | 'click';
};

/**
 * 주어진 영역 밖을 눌렀을 때 알린다.
 *
 * 콜백을 ref로 붙잡아 두므로 호출부가 인라인 화살표를 넘겨도 리스너가 매 렌더 다시 붙지 않는다.
 */
export function useOutsideClick(
  refs: RefObject<HTMLElement | null>[],
  onOutside: () => void,
  { enabled = true, eventType = 'mousedown' }: Options = {},
) {
  const latestOnOutside = useRef(onOutside);
  useEffect(() => {
    latestOnOutside.current = onOutside;
  });

  // 배열 리터럴은 렌더마다 새 참조라 의존성에 그대로 넣으면 리스너가 매번 다시 붙는다.
  const latestRefs = useRef(refs);
  latestRefs.current = refs;

  useEffect(() => {
    if (!enabled) return;

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInside = latestRefs.current.some((ref) => ref.current?.contains(target));
      if (isInside) return;
      latestOnOutside.current();
    };

    document.addEventListener(eventType, handleOutside);
    return () => document.removeEventListener(eventType, handleOutside);
  }, [enabled, eventType]);
}
