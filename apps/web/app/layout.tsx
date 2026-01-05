import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VIBR - Sharing your Music Vibe',
  description: '링크 대신 피드로 추천하는, 사람 기반 소셜 뮤직 큐레이션 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kr">
      <body>{children}</body>
    </html>
  );
}
