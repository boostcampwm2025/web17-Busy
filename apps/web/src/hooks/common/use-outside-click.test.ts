import { renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useOutsideClick } from './use-outside-click';

const mountElement = () => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const ref = createRef<HTMLElement>();
  (ref as { current: HTMLElement | null }).current = el;
  return { el, ref };
};

const press = (target: Node, type: 'mousedown' | 'click' = 'mousedown') => {
  target.dispatchEvent(new MouseEvent(type, { bubbles: true }));
};

describe('useOutsideClick', () => {
  it('fires when the press lands outside every ref', () => {
    const { ref } = mountElement();
    const onOutside = vi.fn();
    renderHook(() => useOutsideClick([ref], onOutside));

    press(document.body);

    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('stays quiet for a press inside any of the refs', () => {
    const a = mountElement();
    const b = mountElement();
    const onOutside = vi.fn();
    renderHook(() => useOutsideClick([a.ref, b.ref], onOutside));

    press(a.el);
    press(b.el);

    expect(onOutside).not.toHaveBeenCalled();
  });

  it('does not listen while disabled', () => {
    const { ref } = mountElement();
    const onOutside = vi.fn();
    renderHook(() => useOutsideClick([ref], onOutside, { enabled: false }));

    press(document.body);

    expect(onOutside).not.toHaveBeenCalled();
  });

  it('listens on click when asked to', () => {
    const { ref } = mountElement();
    const onOutside = vi.fn();
    renderHook(() => useOutsideClick([ref], onOutside, { eventType: 'click' }));

    press(document.body, 'mousedown');
    expect(onOutside).not.toHaveBeenCalled();

    press(document.body, 'click');
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  /** 호출부가 인라인 화살표를 넘겨도 리스너가 매 렌더 다시 붙으면 안 된다. */
  it('keeps one listener across re-renders with an inline callback', () => {
    const { ref } = mountElement();
    const onOutside = vi.fn();
    const addSpy = vi.spyOn(document, 'addEventListener');

    const { rerender } = renderHook(() => useOutsideClick([ref], () => onOutside()));
    const afterFirst = addSpy.mock.calls.filter(([type]) => type === 'mousedown').length;
    rerender();
    rerender();

    expect(addSpy.mock.calls.filter(([type]) => type === 'mousedown').length).toBe(afterFirst);

    press(document.body);
    expect(onOutside).toHaveBeenCalledTimes(1);

    addSpy.mockRestore();
  });

  it('removes the listener on unmount', () => {
    const { ref } = mountElement();
    const onOutside = vi.fn();
    const { unmount } = renderHook(() => useOutsideClick([ref], onOutside));

    unmount();
    press(document.body);

    expect(onOutside).not.toHaveBeenCalled();
  });
});
