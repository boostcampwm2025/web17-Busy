'use client';

import { PropsWithChildren, ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorScreen, LoadingSpinner } from '@/components';

type DrawerProps = PropsWithChildren<{
  isOpen: boolean;
  isSidebarExpanded: boolean;

  /** Suspense fallback (옵션) */
  loadingFallback?: ReactNode;

  /** ErrorBoundary fallback (옵션) */
  errorFallback?: ReactNode;
}>;

export default function Drawer({ isOpen, isSidebarExpanded, children, loadingFallback = <LoadingSpinner /> }: DrawerProps) {
  return (
    <div
      className={`
        absolute top-0 ${isSidebarExpanded ? 'left-64' : 'left-20'} h-full bg-white border-r-2 border-primary z-30
        transition-all duration-300 ease-in-out shadow-[8px_0px_20px_rgba(0,0,0,0.05)]
        ${isOpen ? 'translate-x-0 w-100' : '-translate-x-full w-100 opacity-0 pointer-events-none'}
      `}
    >
      <ErrorBoundary FallbackComponent={ErrorScreen}>
        <Suspense fallback={loadingFallback}>{children}</Suspense>
      </ErrorBoundary>
    </div>
  );
}
