import { useRef } from 'react';
import { View, Image, TouchableOpacity, ScrollView, Text, StyleSheet, useWindowDimensions } from 'react-native';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';
import { usePostMedia } from '@/src/hooks/usePostMedia';

type Props = {
  post: Post;
  currentMusicId: string | null;
  isPlayingGlobal: boolean;
  onPlay: (music: Music) => void;
  onPlayAll?: () => void;
  onOpenDetail: () => void;
};

export default function PostMedia({ post, currentMusicId, isPlayingGlobal, onPlay, onPlayAll, onOpenDetail }: Props) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const { isMulti, activeMusic, coverUrl, isActivePlaying, activeIndex, setActiveIndex } = usePostMedia({
    post,
    currentMusicId,
    isPlayingGlobal,
  });

  const slides = [post.coverImgUrl || '', ...post.musics.map((m) => m.albumCoverUrl || post.coverImgUrl || '')];

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const isCoverPage = activeIndex === 0;

  return (
    <View style={[styles.container, { width, height: width }]}>
      {isMulti ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          style={{ width, height: width }}
        >
          {slides.map((url, i) => (
            // 각 슬라이드에 탭 핸들러 부착 → ScrollView가 스와이프 제스처를 온전히 처리
            <TouchableOpacity key={i} activeOpacity={1} onPress={onOpenDetail}>
              <Image source={{ uri: url || 'https://placehold.co/400x400' }} style={{ width, height: width }} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity activeOpacity={1} onPress={onOpenDetail} style={{ width, height: width }}>
          <Image source={{ uri: coverUrl }} style={{ width, height: width }} resizeMode="cover" />
        </TouchableOpacity>
      )}

      {/* 커버 페이지: 음악이 있으면 전체 재생 버튼 */}
      {isCoverPage && post.musics.length > 0 && onPlayAll && (
        <TouchableOpacity style={styles.playBtn} onPress={onPlayAll} activeOpacity={0.8}>
          <Text style={styles.playIcon}>▶</Text>
        </TouchableOpacity>
      )}

      {/* 개별 음악 슬라이드: 해당 곡 재생 버튼 */}
      {!isCoverPage && activeMusic && (
        <TouchableOpacity style={styles.playBtn} onPress={() => onPlay(activeMusic)} activeOpacity={0.8}>
          <Text style={styles.playIcon}>{isActivePlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
      )}

      {/* 커버 페이지: 전체 재생 배지 */}
      {isCoverPage && post.musics.length > 0 && (
        <View style={styles.infoBox}>
          <Text style={styles.musicTitle}>전체 재생</Text>
        </View>
      )}

      {/* 개별 음악 슬라이드: 곡 정보 */}
      {!isCoverPage && activeMusic && (
        <View style={styles.infoBox}>
          <Text style={styles.musicTitle} numberOfLines={1}>
            {activeMusic.title}
          </Text>
          <Text style={styles.artistName} numberOfLines={1}>
            {activeMusic.artistName}
          </Text>
        </View>
      )}

      {/* 슬라이드 인디케이터 */}
      {isMulti && (
        <View style={styles.indicators}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}

      {/* 곡 수 뱃지 */}
      {isMulti && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{post.musics.length}곡</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    marginBottom: 12,
  },
  playBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -28 }, { translateY: -28 }],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 20,
    color: '#000',
    marginLeft: 2,
  },
  infoBox: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    maxWidth: '70%',
  },
  musicTitle: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  artistName: {
    color: '#444',
    fontWeight: '600',
    fontSize: 11,
    marginTop: 2,
  },
  indicators: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
  },
});
