import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { usePlayerStore } from '@/src/stores';
import MiniPlayer from '@/src/components/player/MiniPlayer';

// TODO: 아이콘 라이브러리 추가 후 교체
function TabIcon({ focused }: { focused: boolean }) {
  return <View style={[styles.dot, focused && styles.dotActive]} />;
}

export default function TabsLayout() {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const TAB_BAR_HEIGHT = 56;

  return (
    <View style={styles.container}>
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
          <MiniPlayer
            onOpenFullPlayer={() => {
              // TODO: 풀 플레이어 구현 후 연결
            }}
          />
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
