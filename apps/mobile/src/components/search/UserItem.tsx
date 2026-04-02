import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { SearchUserDto } from '@repo/dto';
import { addFollow, removeFollow } from '@/src/api';
import { useAuthStore } from '@/src/stores';
import { DEFAULT_IMAGES } from '@/src/constants';

interface Props {
  user: SearchUserDto;
  onFollowChange: (userId: string, isFollowing: boolean) => void;
}

export default function UserItem({ user, onFollowChange }: Props) {
  const myId = useAuthStore((s) => s.userId);
  const isMe = myId === user.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleFollow = async () => {
    if (isMe || isSubmitting) return;

    const next = !user.isFollowing;
    onFollowChange(user.id, next);
    setIsSubmitting(true);

    try {
      if (next) await addFollow(user.id);
      else await removeFollow(user.id);
    } catch {
      onFollowChange(user.id, !next);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: user.profileImgUrl ?? DEFAULT_IMAGES.PROFILE }} style={styles.avatar} />

      <Text style={styles.nickname} numberOfLines={1}>
        {user.nickname}
      </Text>

      {isMe ? (
        <View style={[styles.followBtn, styles.followBtnMe]}>
          <Text style={styles.followBtnMeText}>ME</Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handleToggleFollow}
          disabled={isSubmitting}
          activeOpacity={0.7}
          style={[styles.followBtn, user.isFollowing ? styles.followBtnFollowing : styles.followBtnFollow]}
        >
          <Text style={[styles.followBtnText, user.isFollowing && styles.followBtnFollowingText]}>
            {isSubmitting ? '처리 중' : user.isFollowing ? '팔로우 중' : '팔로우'}
          </Text>
        </TouchableOpacity>
      )}
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
  },
  nickname: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  followBtnMe: {
    borderColor: '#333',
    backgroundColor: 'transparent',
  },
  followBtnMeText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '700',
  },
  followBtnFollow: {
    borderColor: '#ff5eb3',
    backgroundColor: '#ff5eb3',
  },
  followBtnFollowing: {
    borderColor: '#333',
    backgroundColor: 'transparent',
  },
  followBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  followBtnFollowingText: {
    color: '#888',
  },
});
