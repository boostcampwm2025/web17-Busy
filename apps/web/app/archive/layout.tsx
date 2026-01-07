import Header from '@/components/layout/Header';

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header title="archive" />
      {children}
    </>
  );
}
