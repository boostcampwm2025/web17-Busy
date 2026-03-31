import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import YoutubePlayer from 'react-native-youtube-iframe';
import { MusicProvider } from '@repo/dto/values';
import type { MusicResponseDto as Music } from '@repo/dto';
import { usePlayerStore } from '@/src/stores';
import { useItunesHook } from '@/src/hooks/player/useItunesHook';
import { useYouTubeHook } from '@/src/hooks/player/useYouTubeHook';
import { formatMs } from '@/src/utils/time';
import { DEFAULT_IMAGES } from '@/src/constants';

interface Props {
  onClose: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const COVER_SIZE = SCREEN_WIDTH - 64;
const YOUTUBE_HEIGHT = Math.round((SCREEN_WIDTH * 9) / 16);

export default function FullPlayer({ onClose }: Props) {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const playNext = usePlayerStore((s) => s.playNext);
  const queue = usePlayerStore((s) => s.queue);
  const selectMusic = usePlayerStore((s) => s.selectMusic);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const playError = usePlayerStore((s) => s.playError);

  const isYouTube = currentMusic?.provider === MusicProvider.YOUTUBE;

  // iTunes 훅 (항상 실행, isItunes 아닐 때는 내부에서 무동작)
  const { positionMs: itunesPositionMs, durationMs: itunesDurationMs, seekToMs: itunesSeekToMs } = useItunesHook();

  // YouTube 훅
  const { playerRef, positionMs: ytPositionMs, durationMs: ytDurationMs, seekToMs: ytSeekToMs, onReady, onChangeState, onError } = useYouTubeHook();

  const positionMs = isYouTube ? ytPositionMs : itunesPositionMs;
  const durationMs = isYouTube ? ytDurationMs : itunesDurationMs;
  const seekToMs = isYouTube ? ytSeekToMs : itunesSeekToMs;

  const canPrev = queue.length > 1;
  const canNext = queue.length > 1;

  const youtubeVideoId = isYouTube ? (currentMusic?.trackUri ?? '') : '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>↓</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>지금 재생 중</Text>
        <View style={styles.closeBtn} />
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.playerSection}>
            {/* YouTube 플레이어: 전체 너비 16:9, playerSection 패딩 밖으로 */}
            {isYouTube && youtubeVideoId ? (
              <View style={styles.youtubeContainer}>
                <YoutubePlayer
                  ref={playerRef}
                  height={YOUTUBE_HEIGHT}
                  width={SCREEN_WIDTH}
                  videoId={youtubeVideoId}
                  play={isPlaying}
                  forceAndroidAutoplay
                  onReady={onReady}
                  onChangeState={onChangeState}
                  onError={onError}
                />
              </View>
            ) : null}

            {/* iTunes 앨범 커버 */}
            {!isYouTube && (
              <View style={styles.coverWrapper}>
                <Image source={{ uri: currentMusic?.albumCoverUrl || DEFAULT_IMAGES.ALBUM }} style={styles.coverImage} />
              </View>
            )}

            {/* 트랙 정보 */}
            <View style={styles.trackInfo}>
              {currentMusic ? (
                <>
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {currentMusic.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {currentMusic.artistName}
                  </Text>
                </>
              ) : (
                <Text style={styles.noMusic}>재생 중인 음악이 없습니다.</Text>
              )}
            </View>

            {/* 에러 배너 */}
            {playError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{playError}</Text>
              </View>
            )}

            {/* 진행 바 */}
            <View style={styles.progressSection}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={durationMs > 0 ? durationMs : 1}
                value={positionMs}
                minimumTrackTintColor="#00ebc7"
                maximumTrackTintColor="#333"
                thumbTintColor="#00ebc7"
                disabled={!currentMusic || durationMs <= 0}
                onSlidingComplete={seekToMs}
              />
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatMs(positionMs)}</Text>
                <Text style={styles.timeText}>{formatMs(durationMs)}</Text>
              </View>
            </View>

            {/* 컨트롤 버튼 */}
            <View style={styles.controls}>
              <TouchableOpacity onPress={playPrev} disabled={!canPrev} style={styles.ctrlBtn} hitSlop={8}>
                <Text style={[styles.ctrlIcon, !canPrev && styles.disabled]}>⏮</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={togglePlay} style={styles.playBtn} activeOpacity={0.8} disabled={!currentMusic}>
                <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={playNext} disabled={!canNext} style={styles.ctrlBtn} hitSlop={8}>
                <Text style={[styles.ctrlIcon, !canNext && styles.disabled]}>⏭</Text>
              </TouchableOpacity>
            </View>

            {/* 구분선 + 재생목록 헤더 */}
            <View style={styles.divider} />
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitle}>재생 목록</Text>
              <TouchableOpacity onPress={clearQueue} hitSlop={8}>
                <Text style={styles.clearBtn}>비우기</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item, index }: { item: Music; index: number }) => {
          const isCurrent = currentMusic?.id === item.id;
          return (
            <TouchableOpacity style={[styles.queueItem, isCurrent && styles.queueItemActive]} onPress={() => selectMusic(item)} activeOpacity={0.7}>
              <Text style={[styles.queueIndex, isCurrent && styles.queueIndexActive]}>{index + 1}</Text>
              <Image source={{ uri: item.albumCoverUrl }} style={styles.queueCover} />
              <View style={styles.queueInfo}>
                <Text style={[styles.queueItemTitle, isCurrent && styles.queueItemTitleActive]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.queueItemArtist} numberOfLines={1}>
                  {item.artistName}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
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
  headerTitle: {
    color: '#ff5eb3',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  playerSection: {
    paddingHorizontal: 32,
    paddingBottom: 8,
  },
  coverWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  youtubeContainer: {
    width: SCREEN_WIDTH,
    height: YOUTUBE_HEIGHT,
    marginHorizontal: -32, // playerSection의 paddingHorizontal: 32를 상쇄
    backgroundColor: '#000',
    marginBottom: 24,
  },
  coverImage: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 16,
    backgroundColor: '#333',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  trackTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
  },
  trackArtist: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
  },
  noMusic: {
    color: '#555',
    fontSize: 14,
  },
  errorBanner: {
    backgroundColor: '#ff1e5640',
    borderWidth: 1,
    borderColor: '#ff1e56',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#ff1e56',
    fontSize: 13,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  timeText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  ctrlBtn: {
    padding: 8,
  },
  ctrlIcon: {
    fontSize: 28,
    color: '#fff',
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 24,
    color: '#000',
    marginLeft: 2,
  },
  disabled: {
    opacity: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginBottom: 16,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  queueTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  clearBtn: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 32,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  queueItemActive: {
    backgroundColor: '#1e1e1e',
  },
  queueIndex: {
    width: 20,
    color: '#555',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  queueIndexActive: {
    color: '#ff5eb3',
  },
  queueCover: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  queueInfo: {
    flex: 1,
    minWidth: 0,
  },
  queueItemTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  queueItemTitleActive: {
    color: '#ff5eb3',
  },
  queueItemArtist: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
});
