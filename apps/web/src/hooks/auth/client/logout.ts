import { useModalStore } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { clearGuestQueueSession } from '@/hooks/queue/use-guest-queue-session';
import { clearAppAccessToken } from '@/api/auth-token';

/** 명시적 로그아웃과 401 세션 만료가 같은 절차를 쓰도록 모아 둔 정리 함수. */
export function clearClientSession() {
  clearAppAccessToken();
  usePlayerStore.getState().clearQueue();
  useModalStore.getState().closeModal();
  clearGuestQueueSession();
}

export async function performLogout() {
  clearClientSession();
  window.location.assign('/');
}
