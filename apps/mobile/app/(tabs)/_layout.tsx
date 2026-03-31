import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { usePlayerStore } from '@/src/stores';

// TODO: 아이콘 라이브러리 추가 후 교체
function TabIcon({ focused }: { focused: boolean }) {
  return <View style={[styles.dot, focused && styles.dotActive]} />;
}

export default function TabsLayout() {
  const currentMusic = usePlayerStore((s) => s.currentMusic);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#222',
          // 미니 플레이어가 있을 때 탭바 위에 공간 확보
          paddingBottom: currentMusic ? 60 : 8,
          height: currentMusic ? 108 : 56,
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
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#555',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
});
