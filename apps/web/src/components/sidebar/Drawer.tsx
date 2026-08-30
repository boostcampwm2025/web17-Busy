import { PropsWithChildren, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import ErrorScreen from '@/components/common/ErrorScreen';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ResizeHandle from '@/components/layout/ResizeHandle';
import { DRAWER_LEFT_EXPANDED, DRAWER_LEFT_SHRINKED } from '@/constants/sidebar';
import type { useResizable } from '@/hooks/common/use-resizable';

type DrawerProps = PropsWithChildren<{
  isOpen: boolean;
  isSidebarExpanded: boolean;
  title?: string;

  /** useResizable의 반환값을 그대로 넘긴다 */
  resize: ReturnType<typeof useResizable>;
}>;

export default function Drawer({ isOpen, isSidebarExpanded, title, resize, children }: DrawerProps) {
  return (
    <div
      style={{ width: resize.width }}
      className={`
        absolute top-0 ${isSidebarExpanded ? DRAWER_LEFT_EXPANDED : DRAWER_LEFT_SHRINKED} h-full bg-white border-r-2 border-primary z-30
        ${resize.isDragging ? 'transition-none' : 'transition-all duration-300 ease-in-out'} shadow-[8px_0px_20px_rgba(0,0,0,0.05)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full opacity-0 pointer-events-none'}
      `}
    >
      {title && (
        // 높이를 중앙 Header(h-16)와 맞춰 하단 구분선 위치를 정렬 (폰트 크기는 유지)
        <div className="px-6 h-16 flex items-center border-b-2 border-primary flex-shrink-0">
          <h2 className="text-xl font-black text-primary">{title}</h2>
        </div>
      )}
      <ErrorBoundary FallbackComponent={ErrorScreen}>
        <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
      </ErrorBoundary>

      <ResizeHandle side="right" onPointerDown={resize.onPointerDown} isDragging={resize.isDragging} />
    </div>
  );
}
