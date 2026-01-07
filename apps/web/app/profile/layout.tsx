import Header from '@/components/layout/Header';
import { Suspense } from 'react';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header title="profile" />
      <Suspense fallback={<div>프로필 로딩 중...</div>}>{children}</Suspense>
    </>
  );
}
