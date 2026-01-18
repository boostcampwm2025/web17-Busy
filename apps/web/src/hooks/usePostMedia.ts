'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Music, Post } from '@/types';

type Args = {
  post: Post;
  currentMusicId: string | null;
  isPlayingGlobal: boolean;
};

export function usePostMedia({ post, currentMusicId, isPlayingGlobal }: Args) {
  const [activeIndex, setActiveIndex] = useState(0);

  const isMulti = post.musics.length > 1;

  const activeMusic = useMemo<Music | null>(() => post.musics[activeIndex] ?? null, [post.musics, activeIndex]);
  const coverUrl = activeMusic?.albumCoverUrl ?? post.coverImgUrl;

  const isActivePlaying = Boolean(activeMusic && isPlayingGlobal && currentMusicId === activeMusic.id);

  const prev = useCallback(() => {
    if (!isMulti) return;
    setActiveIndex((prevIdx) => (prevIdx - 1 < 0 ? post.musics.length - 1 : prevIdx - 1));
  }, [isMulti, post.musics.length]);

  const next = useCallback(() => {
    if (!isMulti) return;
    setActiveIndex((prevIdx) => (prevIdx + 1) % post.musics.length);
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
  };
}
