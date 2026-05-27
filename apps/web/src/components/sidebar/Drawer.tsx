'use client';

import { PropsWithChildren, ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorScreen, LoadingSpinner } from '@/components';
import { DRAWER_LEFT_EXPANDED, DRAWER_LEFT_SHRINKED } from '@/constants';

type DrawerProps = PropsWithChildren<{
  isOpen: boolean;
  isSidebarExpanded: boolean;
  title?: string;

  /** Suspense fallback (옵션) */
  loadingFallback?: ReactNode;

  /** ErrorBoundary fallback (옵션) */
  errorFallback?: ReactNode;
}>;

export default function Drawer({ isOpen, isSidebarExpanded, title, children, loadingFallback = <LoadingSpinner /> }: DrawerProps) {
  return (
    <div
      className={`
        absolute top-0 ${isSidebarExpanded ? DRAWER_LEFT_EXPANDED : DRAWER_LEFT_SHRINKED} w-2xs xs:w-xs sm:w-md h-full bg-white border-r-2 border-primary z-30
        transition-all duration-300 ease-in-out shadow-[8px_0px_20px_rgba(0,0,0,0.05)]
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
    </div>
  );
}
