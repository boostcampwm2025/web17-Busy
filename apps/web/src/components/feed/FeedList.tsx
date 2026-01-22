'use client';

import { usePlayerStore } from '@/stores';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { PostCard } from '@/components';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';
import { useRouter } from 'next/navigation';

interface FeedListProps {
  posts: Post[];
}

export default function FeedList({ posts }: FeedListProps) {
  const router = useRouter();

  const playMusic = usePlayerStore((s) => s.playMusic);
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.id ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const openModal = useModalStore((s) => s.openModal);

  const handlePlay = (music: Music) => {
    playMusic(music);
  };

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleOpenDetail = (post: Post) => {
    openModal(MODAL_TYPES.POST_DETAIL, { postId: post.id, post });
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPlay={handlePlay}
              onUserClick={handleUserClick}
              onOpenDetail={handleOpenDetail}
              currentMusicId={currentMusicId}
              isPlayingGlobal={isPlaying}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
