import { act, renderHook } from '@testing-library/react';
import type { DragEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useDragReorder } from './use-drag-reorder';

const dragEvent = (transferred = '') => {
  const store = new Map<string, string>([['text/plain', transferred]]);

  return {
    preventDefault: vi.fn(),
    dataTransfer: {
      effectAllowed: '',
      dropEffect: '',
      setData: (type: string, value: string) => store.set(type, value),
      getData: (type: string) => store.get(type) ?? '',
    },
  } as unknown as DragEvent<HTMLElement>;
};

describe('useDragReorder', () => {
  it('드래그가 지나간 항목을 표시하고 dragEnd에 지운다', () => {
    const { result } = renderHook(() => useDragReorder(vi.fn()));

    act(() => result.current.getDragProps(2).onDragOver(dragEvent()));
    expect(result.current.dragOverIndex).toBe(2);

    act(() => result.current.getDragProps(2).onDragEnd());
    expect(result.current.dragOverIndex).toBe(null);
  });

  it('놓은 자리로 onMove를 부른다', () => {
    const onMove = vi.fn();
    const { result } = renderHook(() => useDragReorder(onMove));

    act(() => result.current.getDragProps(0).onDragStart(dragEvent()));
    act(() => result.current.getDragProps(2).onDrop(dragEvent()));

    expect(onMove).toHaveBeenCalledWith(0, 2);
    expect(result.current.dragOverIndex).toBe(null);
  });

  it('제자리에 놓으면 onMove를 부르지 않는다', () => {
    const onMove = vi.fn();
    const { result } = renderHook(() => useDragReorder(onMove));

    act(() => result.current.getDragProps(1).onDragStart(dragEvent()));
    act(() => result.current.getDragProps(1).onDrop(dragEvent()));

    expect(onMove).not.toHaveBeenCalled();
  });

  // 드래그 도중 목록이 다시 렌더되면 dragIndex가 비어 있을 수 있다.
  it('출발 인덱스를 잃으면 dataTransfer 값으로 복구한다', () => {
    const onMove = vi.fn();
    const { result } = renderHook(() => useDragReorder(onMove));

    act(() => result.current.getDragProps(3).onDrop(dragEvent('1')));

    expect(onMove).toHaveBeenCalledWith(1, 3);
  });

  it('출발 인덱스를 어디서도 못 구하면 onMove를 부르지 않는다', () => {
    const onMove = vi.fn();
    const { result } = renderHook(() => useDragReorder(onMove));

    act(() => result.current.getDragProps(3).onDrop(dragEvent('')));

    expect(onMove).not.toHaveBeenCalled();
  });

  it('dragStart가 출발 인덱스를 dataTransfer에 싣는다', () => {
    const { result } = renderHook(() => useDragReorder(vi.fn()));
    const event = dragEvent();

    act(() => result.current.getDragProps(4).onDragStart(event));

    expect(event.dataTransfer.getData('text/plain')).toBe('4');
  });
});
