import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@components/sidebar/Sidebar';
import ModalContainer from '@components/modals/ModalContainer';

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
      <body>
        <ModalContainer />

        <div className="flex h-screen">
          {/* 좌측 사이드바 영역 */}
          <Sidebar />

          <div className="flex flex-col w-full h-full lg:flex-row">
            {/* 중앙 페이지 라우팅 영역 */}
            <main className="h-full lg:w-full overflow-y-auto">{children}</main>

            {/* 우측 뮤직 플레이어 영역 */}
            <aside
              className="bg-accent-pink self-end w-full min-h-16 border-t-2 border-primary 
        lg:w-lg lg:h-full lg:flex lg:flex-col lg:border-t-0 lg:border-l-2
        transition-all duration-200 ease-in-out"
            ></aside>
          </div>
        </div>
      </body>
    </html>
  );
}
