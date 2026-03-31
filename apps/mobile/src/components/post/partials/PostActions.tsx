import { View, Text, TouchableOpacity, Share, StyleSheet, Alert } from 'react-native';
import type { PostResponseDto } from '@repo/dto';

type Props = {
  post: PostResponseDto;
  onClickLike?: () => void;
  onClickComment?: () => void;
  disabledLike?: boolean;
};

export default function PostActions({ post, onClickLike, onClickComment, disabledLike = false }: Props) {
  const liked = Boolean(post.isLiked);

  const handleShare = async () => {
    try {
      await Share.share({ message: `VIBR에서 이 게시글을 확인해보세요!` });
    } catch {
      Alert.alert('공유 실패');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.actionBtn} onPress={onClickLike} disabled={disabledLike} activeOpacity={0.7}>
        <Text style={[styles.icon, liked && styles.iconLiked]}>{liked ? '♥' : '♡'}</Text>
        <Text style={[styles.count, liked && styles.countLiked]}>{post.likeCount}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionBtn} onPress={onClickComment} activeOpacity={0.7}>
        <Text style={styles.icon}>💬</Text>
        <Text style={styles.count}>{post.commentCount}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
        <Text style={styles.icon}>↗</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  icon: {
    fontSize: 22,
    color: '#fff',
  },
  iconLiked: {
    color: '#f472b6',
  },
  count: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  countLiked: {
    color: '#f472b6',
  },
});
