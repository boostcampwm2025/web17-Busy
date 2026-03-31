import { useState } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { usePlayerStore } from '@/src/stores';
import { MusicProvider } from '@repo/dto/values';
import MiniPlayer from '@/src/components/player/MiniPlayer';
import FullPlayer from '@/src/components/player/FullPlayer';

// TODO: 아이콘 라이브러리 추가 후 교체
function TabIcon({ focused }: { focused: boolean }) {
  return <View style={[styles.dot, focused && styles.dotActive]} />;
}

export default function TabsLayout() {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const TAB_BAR_HEIGHT = 56;

  // YouTube 트랙: FullPlayer를 동기적으로 열어야 함
  // useEffect로 열면 YoutubePlayer가 zIndex:0(hidden) 상태로 마운트 → IFrame API 초기화 실패
  // 파생 상태 방식: currentMusic이 YouTube이면 즉시 isFullPlayerOpen=true
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [closedMusicId, setClosedMusicId] = useState<string | null>(null);

  const isYouTubeTrack = currentMusic?.provider === MusicProvider.YOUTUBE;
  // YouTube 트랙이면 사용자가 이 트랙을 명시적으로 닫은 게 아닌 한 자동 오픈
  const isFullPlayerOpen = isManualOpen || (isYouTubeTrack && currentMusic?.id !== closedMusicId);

  const handleClose = () => {
    setClosedMusicId(currentMusic?.id ?? null);
    setIsManualOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* 풀 플레이어: Tabs보다 먼저 렌더링
          - 닫힌 상태: zIndex:0 → Tabs(solid background)가 위에 덮여 보이지 않음
          - 열린 상태: zIndex:100 → 최상위에 표시
          opacity 사용 금지 — Android WebView는 opacity:0 부모 안에서 미디어 재생이 차단됨
          translateY 사용 금지 — 화면 밖으로 나간 WebView는 Android에서 suspended 상태가 됨 */}
      {currentMusic && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: isFullPlayerOpen ? 100 : 0 }]} pointerEvents={isFullPlayerOpen ? 'auto' : 'none'}>
          <FullPlayer onClose={handleClose} />
        </View>
      )}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#111',
            borderTopColor: '#222',
            height: TAB_BAR_HEIGHT,
          },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#555',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '피드',
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: '검색',
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '프로필',
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} />,
          }}
        />
      </Tabs>

      {/* 미니 플레이어: 탭바 바로 위에 절대 위치 */}
      {currentMusic && (
        <View style={[styles.miniPlayerWrapper, { bottom: TAB_BAR_HEIGHT }]}>
          <MiniPlayer onOpenFullPlayer={() => setIsManualOpen(true)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#555',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  miniPlayerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
