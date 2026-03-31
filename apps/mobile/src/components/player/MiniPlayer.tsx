import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { usePlayerStore } from '@/src/stores';

interface MiniPlayerProps {
  onOpenFullPlayer: () => void;
}

export default function MiniPlayer({ onOpenFullPlayer }: MiniPlayerProps) {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const playNext = usePlayerStore((s) => s.playNext);
  const queue = usePlayerStore((s) => s.queue);

  if (!currentMusic) return null;

  const canPrev = queue.length > 1;
  const canNext = queue.length > 1;

  return (
    <View style={styles.container}>
      {/* 앨범 커버 + 곡 정보 → 탭하면 풀 플레이어 */}
      <TouchableOpacity style={styles.infoArea} onPress={onOpenFullPlayer} activeOpacity={0.8}>
        <Image source={{ uri: currentMusic.albumCoverUrl }} style={styles.cover} />
        <View style={styles.textBox}>
          <Text style={styles.title} numberOfLines={1}>
            {currentMusic.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentMusic.artistName}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 컨트롤 버튼 */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={playPrev} disabled={!canPrev} style={styles.ctrlBtn} hitSlop={8}>
          <Text style={[styles.ctrlIcon, !canPrev && styles.disabled]}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlay} style={styles.playBtn} activeOpacity={0.8}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext} disabled={!canNext} style={styles.ctrlBtn} hitSlop={8}>
          <Text style={[styles.ctrlIcon, !canNext && styles.disabled]}>⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  infoArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  textBox: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  artist: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctrlBtn: {
    padding: 6,
  },
  ctrlIcon: {
    fontSize: 18,
    color: '#fff',
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: '#000',
    marginLeft: 1,
  },
  disabled: {
    opacity: 0.3,
  },
});
