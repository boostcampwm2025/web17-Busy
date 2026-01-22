// import { logout as logoutApi } from '@/api/internal/auth';
import { useSpotifyAuthStore, usePlayerStore, useSpotifyPlayerStore, useModalStore } from '@/stores';
import { clearGuestQueueSession } from '@/hooks';
import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';

export async function performLogout() {
  // 1) 서버에 쿠키 삭제 요청 (jwt 제거)
  // await logoutApi(); // 현재는 필요 없음
  sessionStorage.removeItem(APP_ACCESS_TOKEN_STORAGE_KEY);

  // 2) FE 상태 초기화
  useSpotifyAuthStore.getState().clear();
  usePlayerStore.getState().clearQueue();
  useSpotifyPlayerStore.getState().reset();
  useModalStore.getState().closeModal();
  clearGuestQueueSession();

  // 3) 화면 갱신(인증 상태 반영)
  window.location.assign('/');
}
