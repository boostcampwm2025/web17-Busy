'use client';

import { PropsWithChildren, ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorScreen, LoadingSpinner, ResizeHandle } from '@/components';
import { DRAWER_LEFT_EXPANDED, DRAWER_LEFT_SHRINKED } from '@/constants';

type DrawerProps = PropsWithChildren<{
  isOpen: boolean;
  isSidebarExpanded: boolean;
  title?: string;

  /** 드로어 너비(px) */
  width: number;
  /** 리사이즈 드래그 중 여부 (드래그 중엔 너비 트랜지션 비활성화) */
  isResizing: boolean;
  /** 리사이즈 핸들 pointerdown 핸들러 */
  onResizePointerDown: (e: React.PointerEvent) => void;

  /** Suspense fallback (옵션) */
  loadingFallback?: ReactNode;

  /** ErrorBoundary fallback (옵션) */
  errorFallback?: ReactNode;
}>;

export default function Drawer({
  isOpen,
  isSidebarExpanded,
  title,
  width,
  isResizing,
  onResizePointerDown,
  children,
  loadingFallback = <LoadingSpinner />,
}: DrawerProps) {
  return (
    <div
      style={{ width }}
      className={`
        absolute top-0 ${isSidebarExpanded ? DRAWER_LEFT_EXPANDED : DRAWER_LEFT_SHRINKED} h-full bg-white border-r-2 border-primary z-30
        ${isResizing ? 'transition-none' : 'transition-all duration-300 ease-in-out'} shadow-[8px_0px_20px_rgba(0,0,0,0.05)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full opacity-0 pointer-events-none'}
      `}
    >
      {title && (
        <div className="px-6 py-4 border-b-2 border-primary flex-shrink-0">
          <h2 className="text-xl font-black text-primary">{title}</h2>
        </div>
      )}
      <ErrorBoundary FallbackComponent={ErrorScreen}>
        <Suspense fallback={loadingFallback}>{children}</Suspense>
      </ErrorBoundary>

      <ResizeHandle side="right" onPointerDown={onResizePointerDown} isDragging={isResizing} />
    </div>
  );
}
