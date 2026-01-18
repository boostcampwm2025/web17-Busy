'use client';

import { PostHeader, PostMedia, PostActions, PostContentPreview } from './index';
import { MusicResponseDto, PostResponseDto } from '@repo/dto';

interface PostCardProps {
  post: PostResponseDto;

  currentMusicId: string | null;
  isPlayingGlobal: boolean;

  onPlay: (music: MusicResponseDto) => void;
  onUserClick: (userId: string) => void;
  onOpenDetail: (post: PostResponseDto) => void;
}

export default function PostCard({ post, currentMusicId, isPlayingGlobal, onPlay, onUserClick, onOpenDetail }: PostCardProps) {
  const handleOpenDetail = () => onOpenDetail(post);

  return (
    <article
      onClick={handleOpenDetail}
      className="bg-white border-2 border-primary rounded-2xl p-6 mb-8 shadow-[3px_3px_0px_0px_#00214D]
                 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#00EBC7] transition-all duration-300 cursor-pointer"
    >
      <PostHeader post={post} onUserClick={onUserClick} />
      <PostMedia
        post={post}
        variant="card"
        currentMusicId={currentMusicId}
        isPlayingGlobal={isPlayingGlobal}
        onPlay={onPlay}
        onClickContainer={handleOpenDetail}
      />
      <PostActions post={post} />
      <PostContentPreview content={post.content} onClickMore={handleOpenDetail} />
    </article>
  );
}
