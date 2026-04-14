import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { GetUserDto as Profile, PostPreviewDto as PostPreview } from '@repo/dto';
import { getUser, getUserProfilePosts, addFollow, removeFollow } from '@/src/api';
import { useAuthStore } from '@/src/stores';
import { DEFAULT_IMAGES } from '@/src/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP) / 2;
const DEFAULT_LIMIT = 12;

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const myId = useAuthStore((s) => s.userId);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFollowSubmitting, setIsFollowSubmitting] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);
  const loadingMoreRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    const data = await getUser(userId);
    setProfile(data);
  }, [userId]);

  const fetchPosts = useCallback(
    async (cursor?: string) => {
      if (!userId) return;
      const data = await getUserProfilePosts(userId, cursor, DEFAULT_LIMIT);
      if (cursor) {
        setPosts((prev) => [...prev, ...data.items]);
      } else {
        setPosts(data.items);
      }
      setHasNext(data.hasNext);
      cursorRef.current = data.nextCursor;
    },
    [userId],
  );

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    Promise.all([fetchProfile(), fetchPosts(undefined)]).finally(() => setIsLoading(false));
  }, [userId, fetchProfile, fetchPosts]);

  const loadMore = useCallback(() => {
    if (!hasNext || loadingMoreRef.current || !cursorRef.current) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    fetchPosts(cursorRef.current).finally(() => {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    });
  }, [hasNext, fetchPosts]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 300;
      if (nearBottom) loadMore();
    },
    [loadMore],
  );

  const handleToggleFollow = async () => {
    if (!profile || isFollowSubmitting) return;
    const next = !profile.isFollowing;
    setProfile((prev) => (prev ? { ...prev, isFollowing: next } : prev));
    setIsFollowSubmitting(true);
    try {
      if (next) await addFollow(profile.id);
      else await removeFollow(profile.id);
    } catch {
      setProfile((prev) => (prev ? { ...prev, isFollowing: !next } : prev));
      Alert.alert('오류', '팔로우 처리에 실패했습니다.');
    } finally {
      setIsFollowSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color="#ff5eb3" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const rows: PostPreview[][] = [];
  for (let i = 0; i < posts.length; i += 2) {
    rows.push(posts.slice(i, i + 2));
  }

  const isMe = myId === userId;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {profile?.nickname ?? ''}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={400}>
        {/* 아바타 + 통계 */}
        <View style={styles.profileSection}>
          <View style={styles.topRow}>
            <Image source={{ uri: profile?.profileImgUrl ?? DEFAULT_IMAGES.PROFILE }} style={styles.avatar} />
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => router.push({ pathname: '/follows', params: { userId, initialTab: 'followers' } })}
                hitSlop={8}
              >
                <Text style={styles.statCount}>{profile?.followerCount ?? 0}</Text>
                <Text style={styles.statLabel}>팔로워</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => router.push({ pathname: '/follows', params: { userId, initialTab: 'following' } })}
                hitSlop={8}
              >
                <Text style={styles.statCount}>{profile?.followingCount ?? 0}</Text>
                <Text style={styles.statLabel}>팔로잉</Text>
              </TouchableOpacity>
              <View style={styles.statItem}>
                <Text style={styles.statCount}>{posts.length}</Text>
                <Text style={styles.statLabel}>게시물</Text>
              </View>
            </View>
          </View>

          {/* 닉네임 + 소개 */}
          <View style={styles.infoSection}>
            <Text style={styles.nickname}>{profile?.nickname}</Text>
            {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </View>

          {/* 팔로우 버튼 (본인 제외) */}
          {!isMe && (
            <TouchableOpacity
              onPress={handleToggleFollow}
              disabled={isFollowSubmitting}
              style={[styles.followBtn, profile?.isFollowing && styles.followBtnFollowing]}
              activeOpacity={0.8}
            >
              {isFollowSubmitting ? (
                <ActivityIndicator color={profile?.isFollowing ? '#888' : '#fff'} size="small" />
              ) : (
                <Text style={[styles.followBtnText, profile?.isFollowing && styles.followBtnFollowingText]}>
                  {profile?.isFollowing ? '팔로우 중' : '팔로우'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.divider} />
        </View>

        {/* 게시물 그리드 */}
        {rows.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <Text style={styles.emptyText}>등록된 게시물이 없습니다.</Text>
          </View>
        ) : (
          rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((post, colIdx) => (
                <TouchableOpacity key={`${post.postId}-${colIdx}`} style={styles.postItem} activeOpacity={0.85}>
                  <Image source={{ uri: post.coverImgUrl }} style={styles.postImage} />
                  {post.isMoreThanOneMusic && (
                    <View style={styles.multiMusicBadge}>
                      <Text style={styles.multiMusicIcon}>⊞</Text>
                    </View>
                  )}
                  <View style={styles.postOverlay}>
                    <Text style={styles.postStat}>♥ {post.likeCount}</Text>
                    <Text style={styles.postStat}>💬 {post.commentCount}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {row.length === 1 && <View style={styles.postItemEmpty} />}
            </View>
          ))
        )}

        {isLoadingMore && <ActivityIndicator color="#ff5eb3" style={styles.loader} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center' },
  loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#222', borderWidth: 2, borderColor: '#ff5eb3' },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statCount: { color: '#fff', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 2 },
  infoSection: { marginBottom: 12 },
  nickname: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  bio: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  followBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ff5eb3',
    alignItems: 'center',
    marginBottom: 16,
  },
  followBtnFollowing: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333' },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  followBtnFollowingText: { color: '#888' },
  divider: { height: 1, backgroundColor: '#222', marginBottom: 0 },
  row: { flexDirection: 'row', gap: GRID_GAP, marginBottom: GRID_GAP },
  postItem: { width: ITEM_SIZE, height: ITEM_SIZE, position: 'relative' },
  postItemEmpty: { width: ITEM_SIZE, height: ITEM_SIZE },
  postImage: { width: '100%', height: '100%', backgroundColor: '#222' },
  multiMusicBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: 3 },
  multiMusicIcon: { color: '#fff', fontSize: 12 },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  postStat: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyWrapper: { paddingTop: 40, alignItems: 'center' },
  emptyText: { color: '#555', fontSize: 14 },
  loader: { paddingVertical: 16 },
});
