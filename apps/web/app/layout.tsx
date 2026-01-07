import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/sidebar/Sidebar';
import RightPanel from '@/components/player/RightPanel';
import ModalContainer from '@/components/modals/ModalContainer';
import Header from '@/components/layout/Header';

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
          {/* 좌측 사이드바 */}
          <Sidebar />

          <div className="flex flex-col flex-1 h-full lg:flex-row">
            {/* 중앙 컨텐츠: column 레이아웃에서 flex-1로 높이 차지 */}
            <main className="flex-1 overflow-y-auto">
              <Header />
              {children}
            </main>

            {/* 우측/하단 플레이어 영역 */}
            <aside className="shrink-0 w-full h-24 border-t-2 border-primary lg:w-95 lg:h-full lg:border-t-0 lg:border-l-2">
              <RightPanel />
            </aside>
          </div>
        </div>
      </body>
    </html>
  );
}
