import { act, renderHook } from '@testing-library/react';
import type { RefObject, TouchEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFullPlayer } from './use-full-player';

const touchAt = (clientY: number) => ({ touches: [{ clientY }] }) as unknown as TouchEvent<HTMLElement>;

const setScrollTop = (ref: RefObject<HTMLDivElement | null>, scrollTop: number) => {
  ref.current = { scrollTop } as HTMLDivElement;
};

const openFullPlayer = () => {
  const { result } = renderHook(() => useFullPlayer());
  act(() => result.current.open());
  return result;
};

describe('useFullPlayer', () => {
  let back: ReturnType<typeof vi.spyOn>;
  let pushState: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    pushState = vi.spyOn(window.history, 'pushState');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('열면 뒤로가기로 닫을 수 있게 history 엔트리를 쌓는다', () => {
    const result = openFullPlayer();

    expect(result.current.isOpen).toBe(true);
    expect(pushState).toHaveBeenCalledTimes(1);
  });

  // 되돌리지 않으면 엔트리가 남아 그다음 뒤로가기 한 번이 아무 일도 하지 않는다
  it('뒤로가기가 아닌 경로로 닫으면 쌓아둔 엔트리를 되돌린다', () => {
    const result = openFullPlayer();

    act(() => result.current.close());

    expect(result.current.isOpen).toBe(false);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('뒤로가기로 닫히면 엔트리는 이미 소비됐으므로 되돌리지 않는다', () => {
    const result = openFullPlayer();

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(result.current.isOpen).toBe(false);
    expect(back).not.toHaveBeenCalled();
  });

  it('닫힌 상태에서 또 닫아도 엔트리를 되돌리지 않는다', () => {
    const result = openFullPlayer();

    act(() => result.current.close());
    act(() => result.current.close());

    expect(back).toHaveBeenCalledTimes(1);
  });

  it('ESC로 닫는다', () => {
    const result = openFullPlayer();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('데스크탑 폭으로 커지면 닫는다', () => {
    const result = openFullPlayer();

    act(() => {
      window.innerWidth = 1280;
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('맨 위에서 아래로 충분히 스와이프하면 닫는다', () => {
    const result = openFullPlayer();
    setScrollTop(result.current.scrollRef, 0);

    act(() => result.current.handleTouchStart(touchAt(100)));
    act(() => result.current.handleTouchMove(touchAt(200)));

    expect(result.current.isOpen).toBe(false);
  });

  it('조금만 끌면 닫지 않는다', () => {
    const result = openFullPlayer();
    setScrollTop(result.current.scrollRef, 0);

    act(() => result.current.handleTouchStart(touchAt(100)));
    act(() => result.current.handleTouchMove(touchAt(150)));

    expect(result.current.isOpen).toBe(true);
  });

  // 목록을 스크롤한 상태에서 아래로 끄는 건 스크롤이지 닫기가 아니다
  it('스크롤된 상태에서는 스와이프로 닫지 않는다', () => {
    const result = openFullPlayer();
    setScrollTop(result.current.scrollRef, 120);

    act(() => result.current.handleTouchStart(touchAt(100)));
    act(() => result.current.handleTouchMove(touchAt(200)));

    expect(result.current.isOpen).toBe(true);
  });
});
