import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/sidebar/Sidebar';
import ResizableRightPanel from '@/components/player/ResizableRightPanel';
import ModalContainer from '@/components/app/ModalContainer';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import MobileNotiOverlay from '@/components/layout/MobileNotiOverlay';
import { Suspense } from 'react';
import PwaInstallBanner from '@/components/app/PwaInstallBanner';
import RootClientEffects from '@/components/app/RootClientEffects';
import ToastProvider from '@/components/app/ToastContainer';
import AuthLoginQueryHandler from '@/components/app/AuthLoginQueryHandler';
import QueryProvider from '@/components/app/QueryProvider';

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
        <QueryProvider>
          <RootClientEffects />
          <PwaInstallBanner />
          <Suspense fallback={<LoadingSpinner />}>
            <AuthLoginQueryHandler />
          </Suspense>
          <ModalContainer />

          <ToastProvider>
            <div className="flex h-dvh overflow-hidden">
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

                {/* 플레이어: 모바일 하단 스트립 / 데스크탑 우측 패널 (너비 드래그 조절) */}
                <ResizableRightPanel />

                {/* 모바일 하단 네비게이션 (flex 흐름 안에서 자연스럽게 맨 아래) */}
                <MobileBottomNav />
              </div>
            </div>

            {/* 모바일 알림 오버레이 (스와이프 제스처 포함) */}
            <MobileNotiOverlay />
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
