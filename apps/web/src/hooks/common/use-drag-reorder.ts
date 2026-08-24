'use client';

import { useState, type DragEvent } from 'react';

export type DragProps = {
  draggable: boolean;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
};

/**
 * HTML5 드래그로 목록 순서를 바꾼다. 자리가 확정될 때만 onMove로 알린다.
 * 출발 인덱스를 dataTransfer에도 싣는 이유: 드래그 도중 목록이 다시 렌더되어
 * state가 날아가는 경우가 있어, 그때는 이벤트에 실린 값으로 복구한다.
 */
export const useDragReorder = (onMove: (from: number, to: number) => void) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const getDragProps = (index: number): DragProps => ({
    draggable: true,

    onDragStart: (event) => {
      setDragIndex(index);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    },

    onDragOver: (event) => {
      event.preventDefault();
      setDragOverIndex(index);
      event.dataTransfer.dropEffect = 'move';
    },

    onDrop: (event) => {
      event.preventDefault();

      // Number('')는 0이라 빈 값이 0번 항목 이동으로 둔갑한다. parseInt는 NaN을 준다.
      const from = dragIndex ?? Number.parseInt(event.dataTransfer.getData('text/plain'), 10);
      reset();

      if (!Number.isFinite(from) || from === index) return;
      onMove(from, index);
    },

    onDragEnd: reset,
  });

  return { dragOverIndex, getDragProps };
};
