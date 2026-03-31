import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Header, Sidebar, RightPanel, ModalContainer, LoadingSpinner } from '@/components';
import NotiPollingGate from '@/components/noti/NotiPollingGate';
import PwaInstallBanner from '@/components/PwaInstallBanner';
import PwaRegister from '@/components/PwaRegister';
import ToastProvider from '@/components/ToastContainer';
import { PrivacyConsentGate } from '@/hooks';
import { AuthBootstrap } from '@/hooks/auth/client/AuthBootstrap';
import AuthLoginQueryHandler from '@/hooks/auth/client/AuthLoginQueryHandler';
import SpotifyTokenFromHash from '@/hooks/auth/client/SpotifyTokenFromHash';
import './globals.css';

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

const MINI_PLAYER_BAR_HEIGHT_MB = 'mb-24';
const MINI_PLAYER_BAR_HEIGHT_HEIGHT = 'h-24';

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
            <Sidebar />

            <div className="relative flex h-full flex-1 lg:flex-row">
              <main className={`flex min-h-0 min-w-0 flex-1 flex-col ${MINI_PLAYER_BAR_HEIGHT_MB} lg:mb-0`}>
                <Header />
                <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
              </main>

              <aside
                className={`absolute bottom-0 min-w-0 w-full ${MINI_PLAYER_BAR_HEIGHT_HEIGHT} border-t-2 border-primary lg:static lg:h-full lg:w-95 lg:border-t-0 lg:border-l-2`}
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
