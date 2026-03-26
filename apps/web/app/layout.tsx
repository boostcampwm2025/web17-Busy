import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header, Sidebar, RightPanel, ModalContainer, LoadingSpinner, MobileBottomNav } from '@/components';
import { Suspense } from 'react';
import NotiPollingGate from '@/components/noti/NotiPollingGate';
import PwaInstallBanner from '@/components/PwaInstallBanner';
import PwaRegister from '@/components/PwaRegister';
import ToastProvider from '@/components/ToastContainer';
import { PrivacyConsentGate } from '@/hooks';
import { AuthBootstrap } from '@/hooks/auth/client/AuthBootstrap';
import AuthLoginQueryHandler from '@/hooks/auth/client/AuthLoginQueryHandler';
import SpotifyTokenFromHash from '@/hooks/auth/client/SpotifyTokenFromHash';

export const metadata: Metadata = {
  title: 'VIBR - Sharing your Music Vibe',
  description: 'Share your music vibe through playlists, posts, and social listening.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VIBR',
  },
};

export const viewport: Viewport = {
  themeColor: '#111111',
};

const MINI_PLAYER_BAR_HEIGHT_HEIGHT = 'h-16';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e;});`,
          }}
        />
      </head>
      <body>
        <PwaRegister />
        <PwaInstallBanner />
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
            {/* 좌측 사이드바 (데스크탑 전용) */}
            <div className="hidden lg:flex h-full">
              <Sidebar />
            </div>

            {/* 모바일: flex-col(위→아래), 데스크탑: flex-row(좌→우) */}
            <div className="flex flex-1 flex-col lg:flex-row min-h-0">
              {/* 중앙 컨텐츠 */}
              <div className="flex-1 flex flex-col min-h-0 min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
              </div>

              {/* 플레이어: 모바일 하단 스트립 / 데스크탑 우측 패널 */}
              <aside
                className={`relative z-[10000] flex-shrink-0 min-w-0 w-full ${MINI_PLAYER_BAR_HEIGHT_HEIGHT} border-t-2 border-primary lg:z-auto lg:w-95 lg:h-full lg:border-t-0 lg:border-l-2`}
              >
                <RightPanel />
              </aside>

              {/* 모바일 하단 네비게이션 (flex 흐름 안에서 자연스럽게 맨 아래) */}
              <MobileBottomNav />
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
