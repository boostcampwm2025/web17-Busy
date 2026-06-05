'use client';

type ResizeHandleProps = {
  onPointerDown: (e: React.PointerEvent) => void;
  /** 핸들이 붙는 가장자리 */
  side: 'left' | 'right';
  isDragging?: boolean;
};

/**
 * 패널 가장자리에 놓이는 얇은 세로 드래그 바.
 * 로직은 없고 onPointerDown만 부모(useResizable)로 전달한다.
 */
export default function ResizeHandle({ onPointerDown, side, isDragging }: ResizeHandleProps) {
  return (
    <div
      onPointerDown={onPointerDown}
      role="separator"
      aria-orientation="vertical"
      className={`
        absolute top-0 ${side === 'right' ? '-right-1' : '-left-1'} w-2 h-full z-50
        cursor-col-resize transition-colors
        ${isDragging ? 'bg-primary/30' : 'hover:bg-primary/20'}
      `}
    />
  );
}
