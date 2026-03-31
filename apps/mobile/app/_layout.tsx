import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setOnSessionExpired } from '@/src/api/client';
import { useAuthStore } from '@/src/stores';
import { authMe } from '@/src/api';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, setAuth, setLoading, clearAuth } = useAuthStore();

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    authMe()
      .then((user) => setAuth({ userId: user.id, isAuthenticated: true }))
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
  }, []);

  // 세션 만료 시 로그인 화면으로 이동
  useEffect(() => {
    setOnSessionExpired(() => {
      clearAuth();
      router.replace('/(auth)/login');
    });
  }, []);

  // 인증 상태에 따라 라우팅 분기
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <>
      <Slot />
      <StatusBar style="light" />
    </>
  );
}
