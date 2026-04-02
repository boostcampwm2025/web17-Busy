import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { GetUserDto as Profile, PostPreviewDto as PostPreview } from '@repo/dto';
import { getUser, getUserProfilePosts, updateProfile } from '@/src/api';
import { removeToken } from '@/src/api/client';
import { useAuthStore } from '@/src/stores';
import { DEFAULT_IMAGES } from '@/src/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP) / 2;
const DEFAULT_LIMIT = 12;

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, clearAuth } = useAuthStore();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);
  const loadingMoreRef = useRef(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleEditStart = () => {
    setEditNickname(profile?.nickname ?? '');
    setEditBio(profile?.bio ?? '');
    setIsEditing(true);
  };

  const handleEditCancel = () => setIsEditing(false);

  const handleEditSave = async () => {
    const nickname = editNickname.trim();
    if (nickname.length < 2) {
      Alert.alert('알림', '닉네임은 2자 이상이어야 합니다.');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ nickname, bio: editBio });
      // 응답 대신 입력값으로 직접 반영 (응답 포맷 불일치 방지)
      setProfile((prev) => (prev ? { ...prev, nickname, bio: editBio } : prev));
      setIsEditing(false);
    } catch {
      Alert.alert('오류', '프로필 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await removeToken();
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color="#ff5eb3" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // 2열 그리드 행 생성
  const rows: PostPreview[][] = [];
  for (let i = 0; i < posts.length; i += 2) {
    rows.push(posts.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={400} keyboardShouldPersistTaps="handled">
        {/* 프로필 헤더 */}
        <View style={styles.header}>
          {/* 아바타 + 통계 */}
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

          {/* 닉네임 + 자기소개 */}
          {isEditing ? (
            <View style={styles.editSection}>
              <TextInput
                style={styles.editInput}
                value={editNickname}
                onChangeText={setEditNickname}
                placeholder="닉네임 (2~12자)"
                placeholderTextColor="#555"
                maxLength={12}
                autoFocus
              />
              <TextInput
                style={[styles.editInput, styles.editBio]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="자기소개"
                placeholderTextColor="#555"
                multiline
                maxLength={255}
              />
              <View style={styles.editBtns}>
                <TouchableOpacity onPress={handleEditCancel} style={styles.cancelBtn} disabled={isSaving}>
                  <Text style={styles.cancelBtnText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleEditSave} style={styles.saveBtn} disabled={isSaving}>
                  {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>저장</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoSection}>
              <View style={styles.nicknameRow}>
                <Text style={styles.nickname}>{profile?.nickname}</Text>
                <TouchableOpacity onPress={handleEditStart} hitSlop={8}>
                  <Text style={styles.editIconText}>✏️</Text>
                </TouchableOpacity>
              </View>
              {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : <Text style={styles.bioPlaceholder}>자기소개를 입력해주세요.</Text>}
            </View>
          )}

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>

          <View style={styles.divider} />
        </View>

        {/* 게시물 2열 그리드 */}
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
              {/* 홀수 개일 때 빈 칸으로 채우기 */}
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
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#ff5eb3',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statCount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 12,
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nickname: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  editIconText: {
    fontSize: 14,
  },
  bio: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
  },
  bioPlaceholder: {
    color: '#444',
    fontSize: 13,
  },
  editSection: {
    marginBottom: 12,
    gap: 8,
  },
  editInput: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  editBio: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  editBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#888',
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ff5eb3',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  logoutBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  logoutText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
  },
  row: {
    flexDirection: 'row',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  postItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    position: 'relative',
  },
  postItemEmpty: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
  },
  multiMusicBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 3,
  },
  multiMusicIcon: {
    color: '#fff',
    fontSize: 12,
  },
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
  postStat: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyWrapper: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
  },
  loader: {
    paddingVertical: 16,
  },
});
