import Header from '@/components/layout/Header';

export default function SettingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header title="setting" />
      {children}
    </>
  );
}
