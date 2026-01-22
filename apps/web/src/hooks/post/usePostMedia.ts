'use client';

import { useCallback, useMemo, useState } from 'react';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';
import { coalesceImageSrc } from '@/utils';
import { DEFAULT_IMAGES } from '@/constants';

type Args = {
  post: Post;
  currentMusicId: string | null;
  isPlayingGlobal: boolean;
};

export function usePostMedia({ post, currentMusicId, isPlayingGlobal }: Args) {
  const [activeIndex, setActiveIndex] = useState(0);

  const totalLength = post.musics.length + 1;
  const isMulti = totalLength > 1;

  const activeMusic = useMemo<Music | null>(() => {
    if (activeIndex === 0) return null;
    return post.musics[activeIndex - 1] ?? null;
  }, [post.musics, activeIndex]);

  // 0번째는 무조건 커버이미지
  const coverUrl = useMemo(() => {
    const raw = activeIndex === 0 ? post.coverImgUrl : (activeMusic?.albumCoverUrl ?? post.coverImgUrl);
    return coalesceImageSrc(raw, DEFAULT_IMAGES.ALBUM); // 빈 문자열 방지
  }, [activeIndex, activeMusic, post.coverImgUrl]);

  const isActivePlaying = Boolean(activeMusic && isPlayingGlobal && currentMusicId === activeMusic.id);

  const prev = useCallback(() => {
    if (!isMulti) return;
    setActiveIndex((prevIdx) => (prevIdx - 1 < 0 ? totalLength - 1 : prevIdx - 1));
  }, [isMulti, post.musics.length]);

  const next = useCallback(() => {
    if (!isMulti) return;
    setActiveIndex((prevIdx) => (prevIdx + 1) % totalLength);
  }, [isMulti, post.musics.length]);

  return {
    activeIndex,
    setActiveIndex,
    isMulti,
    activeMusic,
    coverUrl,
    isActivePlaying,
    prev,
    next,
    totalLength,
  };
}
