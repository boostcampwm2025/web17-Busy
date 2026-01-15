'use client';

import { useMemo, useState } from 'react';
import { usePlayerStore } from '@/stores';
import { PostCard, PostDetailModal } from './index';
import { Post, Music } from '@/types';

interface FeedListProps {
  posts: Post[];
}

export default function FeedList({ posts }: FeedListProps) {
  const playMusic = usePlayerStore((s) => s.playMusic);
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.musicId ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handlePlay = (music: Music) => {
    playMusic(music);
  };

  const handleUserClick = (userId: string) => {
    // TODO(#next): 프로필 라우팅 연결(정책에 맞게 /profile or /profile/{id})
    void userId;
  };

  const handleOpenDetail = (post: Post) => {
    setSelectedPost(post);
  };

  const handleCloseDetail = () => {
    setSelectedPost(null);
  };

  const renderPosts = useMemo(() => {
    return posts.map((post) => (
      <PostCard
        key={post.postId}
        post={post}
        onPlay={handlePlay}
        onUserClick={handleUserClick}
        onOpenDetail={handleOpenDetail}
        currentMusicId={currentMusicId}
        isPlayingGlobal={isPlaying}
      />
    ));
  }, [posts, handlePlay, handleUserClick, handleOpenDetail, isPlaying, currentMusicId]);

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-4">{renderPosts}</div>
      </div>
      <PostDetailModal
        isOpen={!!selectedPost}
        post={selectedPost}
        onClose={handleCloseDetail}
        onPlay={handlePlay}
        isPlaying={isPlaying}
        currentMusicId={currentMusicId}
      />
    </div>
  );
}
