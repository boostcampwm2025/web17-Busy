import { useModalStore } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSpotifyAuthStore } from '@/stores/useSpotifyAuthStore';
import { useSpotifyPlayerStore } from '@/stores/useSpotifyPlayerStore';
import { clearGuestQueueSession } from '@/hooks/queue/useGuestQueueSession';
import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';

/** 명시적 로그아웃과 401 세션 만료가 같은 절차를 쓰도록 모아 둔 정리 함수. */
export function clearClientSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(APP_ACCESS_TOKEN_STORAGE_KEY);
  }

  useSpotifyAuthStore.getState().clear();
  usePlayerStore.getState().clearQueue();
  useSpotifyPlayerStore.getState().reset();
  useModalStore.getState().closeModal();
  clearGuestQueueSession();
}

export async function performLogout() {
  clearClientSession();
  window.location.assign('/');
}
