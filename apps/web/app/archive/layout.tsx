import Header from '@/components/layout/Header';
import { Suspense } from 'react';

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header title="archive" />
      <Suspense fallback={<div>보관함 로딩 중...</div>}>{children}</Suspense>
    </>
  );
}
