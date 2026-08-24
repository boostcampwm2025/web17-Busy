import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useConfirm } from './use-confirm';

describe('useConfirm', () => {
  it('처음에는 닫혀 있고 open으로 열린다', () => {
    const { result } = renderHook(() => useConfirm(vi.fn()));

    expect(result.current.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
  });

  it('cancel은 동작을 실행하지 않고 닫기만 한다', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useConfirm(onConfirm));

    act(() => result.current.open());
    act(() => result.current.cancel());

    expect(result.current.isOpen).toBe(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirm은 닫으면서 동작을 실행한다', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useConfirm(onConfirm));

    act(() => result.current.open());
    act(() => result.current.confirm());

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });

  it('cancel 참조는 리렌더에도 고정된다', () => {
    const { result, rerender } = renderHook(() => useConfirm(vi.fn()));

    const firstCancel = result.current.cancel;
    const firstOpen = result.current.open;
    rerender();

    expect(result.current.cancel).toBe(firstCancel);
    expect(result.current.open).toBe(firstOpen);
  });
});
