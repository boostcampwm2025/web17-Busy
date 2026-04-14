import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { UserWithFollowStatusDto } from '@repo/dto';
import { getFollowerUsers, getFollowingUsers } from '@/src/api';
import UserItem from '@/src/components/search/UserItem';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TABS = ['팔로워', '팔로잉'] as const;
type TabIndex = 0 | 1;
const DEFAULT_LIMIT = 20;

type FollowList = {
  items: UserWithFollowStatusDto[];
  hasNext: boolean;
  cursor: string | undefined;
  status: 'idle' | 'loading' | 'success' | 'error';
};

const EMPTY_LIST: FollowList = { items: [], hasNext: false, cursor: undefined, status: 'idle' };

export default function FollowsScreen() {
  const router = useRouter();
  const { userId, initialTab } = useLocalSearchParams<{ userId: string; initialTab?: string }>();

  const initialIndex: TabIndex = initialTab === 'following' ? 1 : 0;
  const [activeTab, setActiveTab] = useState<TabIndex>(initialIndex);
  const scrollRef = useRef<ScrollView>(null);
  const isScrollingRef = useRef(false);

  // 스와이프 위치 추적 → 인디케이터 애니메이션
  const scrollX = useRef(new Animated.Value(initialIndex * SCREEN_WIDTH)).current;
  const TAB_WIDTH = SCREEN_WIDTH / 2;
  const indicatorTranslateX = scrollX.interpolate({
    inputRange: [0, SCREEN_WIDTH],
    outputRange: [0, TAB_WIDTH],
    extrapolate: 'clamp',
  });

  const [followers, setFollowers] = useState<FollowList>(EMPTY_LIST);
  const [following, setFollowing] = useState<FollowList>(EMPTY_LIST);
  const loadingMoreRef = useRef<[boolean, boolean]>([false, false]);

  const [followOverrides, setFollowOverrides] = useState<Map<string, boolean>>(new Map());

  const handleFollowChange = useCallback((targetUserId: string, isFollowing: boolean) => {
    setFollowOverrides((prev) => new Map(prev).set(targetUserId, isFollowing));
  }, []);

  // 팔로워 로드
  const loadFollowers = useCallback(
    async (cursor?: string) => {
      if (!userId) return;
      setFollowers((prev) => ({ ...prev, status: 'loading' }));
      try {
        const data = await getFollowerUsers(userId, cursor, DEFAULT_LIMIT);
        setFollowers((prev) => ({
          items: cursor ? [...prev.items, ...data.users] : data.users,
          hasNext: data.hasNext,
          cursor: data.nextCursor,
          status: 'success',
        }));
      } catch {
        setFollowers((prev) => ({ ...prev, status: 'error' }));
      }
    },
    [userId],
  );

  // 팔로잉 로드
  const loadFollowing = useCallback(
    async (cursor?: string) => {
      if (!userId) return;
      setFollowing((prev) => ({ ...prev, status: 'loading' }));
      try {
        const data = await getFollowingUsers(userId, cursor, DEFAULT_LIMIT);
        setFollowing((prev) => ({
          items: cursor ? [...prev.items, ...data.users] : data.users,
          hasNext: data.hasNext,
          cursor: data.nextCursor,
          status: 'success',
        }));
      } catch {
        setFollowing((prev) => ({ ...prev, status: 'error' }));
      }
    },
    [userId],
  );

  // 초기 로드
  useEffect(() => {
    loadFollowers();
    loadFollowing();
  }, [loadFollowers, loadFollowing]);

  // 탭 선택 시 ScrollView 이동
  const handleTabPress = (index: TabIndex) => {
    setActiveTab(index);
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  };

  // 스와이프 끝났을 때 탭 동기화
  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH) as TabIndex;
    if (index !== activeTab) setActiveTab(index);
    isScrollingRef.current = false;
  };

  // 초기 탭 위치 설정
  useEffect(() => {
    if (initialIndex === 1) {
      scrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: false });
    }
  }, [initialIndex]);

  const loadMoreFollowers = useCallback(() => {
    if (!followers.hasNext || loadingMoreRef.current[0] || !followers.cursor) return;
    loadingMoreRef.current[0] = true;
    loadFollowers(followers.cursor).finally(() => {
      loadingMoreRef.current[0] = false;
    });
  }, [followers.hasNext, followers.cursor, loadFollowers]);

  const loadMoreFollowing = useCallback(() => {
    if (!following.hasNext || loadingMoreRef.current[1] || !following.cursor) return;
    loadingMoreRef.current[1] = true;
    loadFollowing(following.cursor).finally(() => {
      loadingMoreRef.current[1] = false;
    });
  }, [following.hasNext, following.cursor, loadFollowing]);

  const applyOverrides = (users: UserWithFollowStatusDto[]) =>
    users.map((u) => ({
      ...u,
      isFollowing: followOverrides.has(u.id) ? (followOverrides.get(u.id) as boolean) : u.isFollowing,
    }));

  const renderList = (list: FollowList, loadMore: () => void) => {
    if (list.status === 'loading' && list.items.length === 0) {
      return (
        <View style={styles.centerMsg}>
          <ActivityIndicator color="#ff5eb3" />
        </View>
      );
    }
    if (list.status === 'error') {
      return (
        <View style={styles.centerMsg}>
          <Text style={styles.errorText}>불러오기 실패</Text>
        </View>
      );
    }
    if (list.status === 'success' && list.items.length === 0) {
      return (
        <View style={styles.centerMsg}>
          <Text style={styles.emptyText}>목록이 없습니다.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={applyOverrides(list.items)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserItem user={item as any} onFollowChange={handleFollowChange} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={list.status === 'loading' ? <ActivityIndicator color="#ff5eb3" style={styles.loader} /> : null}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>팔로우</Text>
        <View style={styles.backBtn} />
      </View>

      {/* 탭 바 */}
      <View style={styles.tabBar}>
        {TABS.map((label, idx) => (
          <TouchableOpacity key={label} style={styles.tab} onPress={() => handleTabPress(idx as TabIndex)} activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
        {/* 스와이프와 함께 움직이는 인디케이터 */}
        <Animated.View style={[styles.indicator, { transform: [{ translateX: indicatorTranslateX }] }]} />
      </View>

      {/* 스와이프 가능한 페이지 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScroll={(e) => scrollX.setValue(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {/* 팔로워 */}
        <View style={styles.page}>{renderList(followers, loadMoreFollowers)}</View>
        {/* 팔로잉 */}
        <View style={styles.page}>{renderList(following, loadMoreFollowing)}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: '#ff5eb3',
    width: SCREEN_WIDTH / 2,
  },
  pager: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  centerMsg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
  },
  errorText: {
    color: '#ff5eb3',
    fontSize: 14,
  },
  loader: {
    paddingVertical: 12,
  },
});
