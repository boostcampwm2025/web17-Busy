'use client';

import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

type BannerType = 'chromium' | 'ios' | null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __pwaPrompt?: BeforeInstallPromptEvent;
  }
}

function detectBannerType(): BannerType {
  const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
  if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return null;
  if (window.matchMedia('(display-mode: standalone)').matches) return null;

  const ua = navigator.userAgent;

  const isIos = /iphone|ipad|ipod/i.test(ua) && !(navigator as unknown as { standalone?: boolean }).standalone;
  if (isIos) return 'ios';

  // Chrome / Edge / Samsung Internet – beforeinstallprompt 지원 브라우저
  // serviceWorker 체크 제외: HTTP(192.168.x.x 등)에서는 SW 미지원이지만 배너는 표시해야 함
  const isChromium = /chrome|edg|samsungbrowser/i.test(ua) && !/firefox/i.test(ua);
  if (isChromium) return 'chromium';

  return null;
}

export default function PwaInstallBanner() {
  const [bannerType, setBannerType] = useState<BannerType>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const type = detectBannerType();
    setBannerType(type);

    if (type !== 'chromium') return;

    // 인라인 스크립트에서 미리 캡처해둔 이벤트 확인
    if (window.__pwaPrompt) {
      setDeferredPrompt(window.__pwaPrompt);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setBannerType(null);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setBannerType(null);
    setDeferredPrompt(null);
  };

  if (!bannerType) return null;

  return (
    <div className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-gray-3 bg-white p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="VIBR" className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">VIBR 앱 설치</p>
          <p className="mt-0.5 text-xs text-gray-1">
            {bannerType === 'ios' ? (
              <>
                하단 <span className="font-medium text-primary">공유</span> 버튼 → <span className="font-medium text-primary">홈 화면에 추가</span>를
                탭하세요.
              </>
            ) : (
              '홈 화면에 추가하면 앱처럼 빠르게 실행할 수 있어요.'
            )}
          </p>
        </div>
        <button onClick={dismiss} className="shrink-0 text-gray-2 transition hover:text-primary" aria-label="닫기">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {bannerType === 'chromium' && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={dismiss}
            className="flex-1 rounded-xl border border-gray-3 py-2 text-xs font-medium text-gray-1 transition hover:bg-gray-4"
          >
            나중에
          </button>
          <button
            onClick={install}
            disabled={!deferredPrompt}
            className="flex-1 rounded-xl bg-accent-cyan py-2 text-xs font-semibold text-primary transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            설치하기
          </button>
        </div>
      )}
    </div>
  );
}
