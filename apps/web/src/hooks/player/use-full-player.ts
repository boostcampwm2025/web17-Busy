import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';

const DESKTOP_MIN_WIDTH = 1024;
const SWIPE_CLOSE_DISTANCE = 80;

/**
 * 모바일 전체화면 플레이어의 열림 상태와 닫는 네 가지 경로(뒤로가기·ESC·데스크탑 리사이즈·스와이프)를 모은다.
 *
 * 열 때 history 엔트리를 하나 쌓아 뒤로가기로 닫히게 하고, 나머지 경로로 닫을 때는 그 엔트리를 직접 되돌린다.
 * 되돌리지 않으면 엔트리가 남아 그다음 뒤로가기 한 번이 아무 일도 하지 않는다.
 */
export const useFullPlayer = () => {
  const [isOpen, setIsOpen] = useState(false);

  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const hasHistoryEntryRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef(0);

  const open = useCallback(() => {
    if (isOpenRef.current) return;

    isOpenRef.current = true;
    setIsOpen(true);

    history.pushState({ vibrFullPlayer: true }, '');
    hasHistoryEntryRef.current = true;
  }, []);

  const close = useCallback(() => {
    if (!isOpenRef.current) return;

    isOpenRef.current = false;
    setIsOpen(false);

    if (!hasHistoryEntryRef.current) return;
    hasHistoryEntryRef.current = false;
    history.back();
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (!isOpenRef.current) return;

      // 뒤로가기로 닫히는 경로. 엔트리는 브라우저가 이미 소비했으니 되돌리지 않는다.
      hasHistoryEntryRef.current = false;
      isOpenRef.current = false;
      setIsOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    const onResize = () => {
      if (window.innerWidth >= DESKTOP_MIN_WIDTH) close();
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [close]);

  const handleTouchStart = (e: TouchEvent<HTMLElement>) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? 0;
  };

  const handleTouchMove = (e: TouchEvent<HTMLElement>) => {
    // 목록이 스크롤된 상태에서 아래로 끄는 건 스크롤이지 닫기가 아니다. scrollRef는 그 스크롤 영역을 가리킨다.
    if ((scrollRef.current?.scrollTop ?? 0) > 0) return;

    if ((e.touches[0]?.clientY ?? 0) - touchStartYRef.current > SWIPE_CLOSE_DISTANCE) close();
  };

  return { isOpen, scrollRef, open, close, handleTouchStart, handleTouchMove };
};
