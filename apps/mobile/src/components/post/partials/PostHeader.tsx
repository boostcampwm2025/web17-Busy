import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { PostResponseDto } from '@repo/dto';
import { coalesceImageSrc, formatRelativeTime } from '@/src/utils';
import { DEFAULT_IMAGES } from '@/src/constants';
import { deletePost } from '@/src/api';
import { usePostReactionOverridesStore } from '@/src/stores';

type Props = {
  post: PostResponseDto;
  isOwner: boolean;
  onUserClick: (userId: string) => void;
  onEditPost?: () => void;
};

export default function PostHeader({ post, isOwner, onUserClick, onEditPost }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const setDeletedPostId = usePostReactionOverridesStore((s) => s.setDeletedPostId);
  const profileImg = coalesceImageSrc(post.author.profileImgUrl, DEFAULT_IMAGES.PROFILE);
  const createdAtText = formatRelativeTime(post.createdAt);

  const handleDelete = () => {
    setMenuOpen(false);
    Alert.alert('게시글 삭제', '정말로 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(post.id);
            setDeletedPostId(post.id);
          } catch {
            Alert.alert('오류', '삭제에 실패했습니다. 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.userInfo} onPress={() => onUserClick(post.author.id)} activeOpacity={0.7}>
        <Image source={{ uri: profileImg }} style={styles.avatar} />
        <View style={styles.nameBox}>
          <Text style={styles.nickname} numberOfLines={1}>
            {post.author.nickname}
          </Text>
          <Text style={styles.time}>{createdAtText}</Text>
        </View>
      </TouchableOpacity>

      {isOwner && (
        <View>
          <TouchableOpacity onPress={() => setMenuOpen((v) => !v)} style={styles.moreBtn} hitSlop={8}>
            <Text style={styles.moreDots}>•••</Text>
          </TouchableOpacity>

          {menuOpen && (
            <View style={styles.menu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  onEditPost?.();
                }}
              >
                <Text style={styles.menuItemTextEdit}>수정하기</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                <Text style={styles.menuItemTextDelete}>삭제하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
  },
  nameBox: {
    flex: 1,
    minWidth: 0,
  },
  nickname: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  time: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  moreBtn: {
    padding: 8,
  },
  moreDots: {
    color: '#888',
    fontSize: 16,
    letterSpacing: 1,
  },
  menu: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 120,
    zIndex: 50,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemTextEdit: {
    color: '#60a5fa',
    fontWeight: '700',
    fontSize: 14,
  },
  menuItemTextDelete: {
    color: '#f87171',
    fontWeight: '700',
    fontSize: 14,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333',
  },
});
