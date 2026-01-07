import Header from '@/components/layout/Header';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header title="profile" />
      {children}
    </>
  );
}
