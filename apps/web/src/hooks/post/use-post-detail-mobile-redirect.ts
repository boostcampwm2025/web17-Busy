'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import useIsMobile from '@/hooks/common/useIsMobile';
import { useModalStore } from '@/stores/useModalStore';

type Params = {
  enabled: boolean;
  postId?: string;
};

/**
 * 데스크탑 → 모바일 리사이즈 시, 프로필 페이지에서 열린 상세 모달을 posts 피드 페이지로 전환한다.
 *
 * 첫 렌더의 `isMobile`은 전환이 아니라 초기값이므로 건너뛴다.
 * 건너뛰지 않으면 모바일에서 모달을 여는 것만으로 곧장 라우팅된다.
 */
export function usePostDetailMobileRedirect({ enabled, postId }: Params) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const closeModal = useModalStore((s) => s.closeModal);

  const isInitializedRef = useRef(false);
  const prevIsMobileRef = useRef(false);

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      prevIsMobileRef.current = isMobile;
      return;
    }
    const isPreviouslyMobile = prevIsMobileRef.current;
    prevIsMobileRef.current = isMobile;

    if (!isPreviouslyMobile && isMobile && enabled && postId) {
      const profileMatch = pathname.match(/^\/profile\/([^/]+)$/);
      if (profileMatch) {
        closeModal();
        router.push(`/profile/${profileMatch[1]}/posts?postId=${postId}`);
      }
    }
  }, [isMobile, enabled, pathname, postId, router, closeModal]);
}
