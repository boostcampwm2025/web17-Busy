// apps/web/src/features/auth/client/logout.ts
import { logout as logoutApi } from '@/api/internal/auth';
import { useSpotifyAuthStore } from '@/stores/useSpotifyAuthStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSpotifyPlayerStore } from '@/stores/useSpotifyPlayerStore';
import { useModalStore } from '@/stores/useModalStore';

export async function performLogout() {
  // 1) 서버에 쿠키 삭제 요청 (jwt 제거)
  await logoutApi();

  // 2) FE 상태 초기화
  useSpotifyAuthStore.getState().clear();
  usePlayerStore.getState().clearQueue();
  useSpotifyPlayerStore.getState().reset();
  useModalStore.getState().closeModal();

  // 3) 화면 갱신(인증 상태 반영)
  window.location.assign('/');
}
