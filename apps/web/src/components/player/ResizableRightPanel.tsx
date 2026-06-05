'use client';

import RightPanel from './RightPanel';
import { ResizeHandle } from '@/components';
import { useResizable, useIsMobile } from '@/hooks';

const MINI_PLAYER_BAR_HEIGHT = 'h-16';

/**
 * 우측 플레이어 패널 래퍼 (클라이언트).
 * app/layout.tsx는 서버 컴포넌트라 state/이벤트를 못 써서 여기로 분리.
 * - 데스크탑(lg≥1024)에서만 너비 드래그 조절 + 왼쪽 가장자리 핸들
 * - 모바일에서는 하단 스트립(w-full)이라 너비 고정, 핸들 미렌더
 */
export default function ResizableRightPanel() {
  const isMobile = useIsMobile();
  const { width, isDragging, onPointerDown } = useResizable({
    defaultWidth: 380, // lg:w-95 = 95 * 0.25rem = 380px
    min: 280,
    max: 600,
    direction: 'left',
    storageKey: 'vibr:rightPanelWidth',
  });

  return (
    <aside
      style={isMobile ? undefined : { width }}
      className={`relative flex-shrink-0 min-w-0 w-full ${MINI_PLAYER_BAR_HEIGHT} border-t-1 border-primary lg:h-full lg:border-t-0 lg:border-l-2`}
    >
      {!isMobile && <ResizeHandle side="left" onPointerDown={onPointerDown} isDragging={isDragging} />}
      <RightPanel />
    </aside>
  );
}
