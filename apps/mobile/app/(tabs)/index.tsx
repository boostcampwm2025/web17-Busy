import { useCallback, useEffect } from 'react';
import { FlatList, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getFeedPosts } from '@/src/api';
import { usePlayerStore, usePostReactionOverridesStore } from '@/src/stores';
import { useFeedInfiniteScroll } from '@/src/hooks/useFeedInfiniteScroll';
import PostCard from '@/src/components/post/PostCard';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

export default function FeedScreen() {
  const router = useRouter();
  const playMusic = usePlayerStore((s) => s.playMusic);
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.id ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const deletedPostId = usePostReactionOverridesStore((s) => s.deletedPostId);
  const clearDeletedPostId = usePostReactionOverridesStore((s) => s.clearDeletedPostId);

  const { posts, setPosts, isInitialLoading, isLoading, errorMsg, loadMore } = useFeedInfiniteScroll({
    fetchFn: getFeedPosts,
  });

  // 삭제된 게시글 피드에서 제거
  useEffect(() => {
    if (!deletedPostId) return;
    setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
    clearDeletedPostId();
  }, [deletedPostId]);

  const handlePlay = useCallback(
    (music: Music) => {
      playMusic(music);
    },
    [playMusic],
  );

  const handleUserClick = useCallback(
    (userId: string) => {
      router.push(`/profile/${userId}` as any);
    },
    [router],
  );

  const handleOpenDetail = useCallback((_post: Post) => {
    // TODO: 포스트 상세 화면 구현 후 연결
  }, []);

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color="#fff" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentMusicId={currentMusicId}
            isPlayingGlobal={isPlaying}
            onPlay={handlePlay}
            onUserClick={handleUserClick}
            onOpenDetail={handleOpenDetail}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoading ? <ActivityIndicator color="#fff" style={styles.footer} /> : null}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>게시글이 없습니다.</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
      {errorMsg && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 24,
  },
  separator: {
    height: 8,
    backgroundColor: '#000',
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
  },
  errorBar: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#f87171',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
