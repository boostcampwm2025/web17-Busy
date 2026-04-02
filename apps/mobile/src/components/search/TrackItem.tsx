import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MusicProvider } from '@repo/dto/values';
import type { MusicResponseDto as Music } from '@repo/dto';
import { usePlayerStore } from '@/src/stores';

interface Props {
  item: Music;
}

export default function TrackItem({ item }: Props) {
  const playMusic = usePlayerStore((s) => s.playMusic);
  const isVideo = item.provider === MusicProvider.YOUTUBE;

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.albumCoverUrl }} style={[styles.cover, isVideo && styles.coverVideo]} resizeMode="cover" />

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {item.artistName}
        </Text>
      </View>

      <TouchableOpacity onPress={() => playMusic(item)} style={styles.playBtn} hitSlop={8} activeOpacity={0.7}>
        <Text style={styles.playIcon}>▶</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  cover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  coverVideo: {
    width: 80,
    height: 48,
    borderRadius: 6,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  artist: {
    color: '#888',
    fontSize: 12,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 2,
  },
});
