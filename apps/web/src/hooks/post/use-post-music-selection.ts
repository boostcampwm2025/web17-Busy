'use client';

import { useCallback, useState } from 'react';
import type { MusicResponseDto as Music } from '@repo/dto';

import useMusicActions from '@/hooks/common/use-music-actions';
import { dedupeById } from '@/utils/dedupe-by-id';
import { reorder } from '@/utils/reorder';

type Params = {
  initialMusics?: Music[];
};

export type PostMusicSelection = {
  selectedMusics: Music[];
  addMusic: (music: Music) => Promise<void>;
  addMusics: (musics: Music[]) => void;
  removeMusic: (id: string) => void;
  moveMusic: (index: number, direction: 'up' | 'down') => void;
  reset: () => void;
};

const toInitialSelected = (initialMusics?: Music[]): Music[] =>
  Array.isArray(initialMusics) && initialMusics.length > 0 ? dedupeById(initialMusics) : [];

/** 게시글에 담을 곡 목록. 추가·제거·순서만 책임지고, 검색창이나 제출은 모른다. */
export function usePostMusicSelection({ initialMusics }: Params): PostMusicSelection {
  const { ensureMusicInDb } = useMusicActions();
  const [selectedMusics, setSelectedMusics] = useState<Music[]>(() => toInitialSelected(initialMusics));

  // 검색 결과는 아직 DB에 없을 수 있다. 저장 후 돌아온 id로 담아야 중복 판정이 맞는다.
  const addMusic = useCallback(
    async (music: Music) => {
      const savedMusic = await ensureMusicInDb(music);
      setSelectedMusics((prev) => (prev.some((m) => m.id === savedMusic.id) ? prev : [...prev, savedMusic]));
    },
    [ensureMusicInDb],
  );

  const addMusics = useCallback((musics: Music[]) => {
    setSelectedMusics((prev) => {
      const next = musics.filter((m) => !prev.some((p) => p.id === m.id));
      return next.length === 0 ? prev : [...prev, ...next];
    });
  }, []);

  const removeMusic = useCallback((id: string) => {
    setSelectedMusics((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const moveMusic = useCallback((index: number, direction: 'up' | 'down') => {
    setSelectedMusics((prev) => reorder(prev, index, direction));
  }, []);

  const reset = useCallback(() => setSelectedMusics(toInitialSelected(initialMusics)), [initialMusics]);

  return { selectedMusics, addMusic, addMusics, removeMusic, moveMusic, reset };
}
