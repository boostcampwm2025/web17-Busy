import type { Metadata } from 'next';
import './globals.css';
import { Header, Sidebar, RightPanel, ModalContainer, LoadingSpinner } from '@/components';
import SpotifyTokenFromHash from '@/hooks/auth/client/SpotifyTokenFromHash';
import AuthLoginQueryHandler from '@/hooks/auth/client/AuthLoginQueryHandler';
import { Suspense } from 'react';
import NotiPollingGate from '@/components/noti/NotiPollingGate';
import ToastProvider from '@/components/ToastContainer';
import { PrivacyConsentGate } from '@/hooks';
import { AuthBootstrap } from '@/hooks/auth/client/AuthBootstrap';

export const metadata: Metadata = {
  title: 'VIBR - Sharing your Music Vibe',
  description: '링크 대신 피드로 추천하는, 사람 기반 소셜 뮤직 큐레이션 서비스',
  icons: {
    icon: '/favicon.svg',
  },
};

const MINI_PLAYER_BAR_HEIGHT_MB = 'mb-24';
const MINI_PLAYER_BAR_HEIGHT_HEIGHT = 'h-24';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kr">
      <body>
        <SpotifyTokenFromHash />
        <Suspense fallback={<LoadingSpinner />}>
          <AuthLoginQueryHandler />
        </Suspense>
        <ModalContainer />
        <AuthBootstrap />
        <PrivacyConsentGate />
        <NotiPollingGate />

        <ToastProvider>
          <div className="flex h-screen overflow-hidden">
            {/* 좌측 사이드바 */}
            <Sidebar />

            <div className="relative flex flex-1 h-full lg:flex-row">
              {/* 중앙 컨텐츠: column 레이아웃에서 flex-1로 높이 차지 */}
              <main className={`flex-1 flex flex-col min-h-0 min-w-0 ${MINI_PLAYER_BAR_HEIGHT_MB} lg:mb-0`}>
                <Header />
                <div className="flex-1 overflow-y-auto min-w-0">{children}</div>
              </main>

              {/* 우측/하단 플레이어 영역 */}
              <aside
                className={`absolute bottom-0 lg:static min-w-0 w-full ${MINI_PLAYER_BAR_HEIGHT_HEIGHT} border-t-2 border-primary lg:w-95 lg:h-full lg:border-t-0 lg:border-l-2`}
              >
                <RightPanel />
              </aside>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
