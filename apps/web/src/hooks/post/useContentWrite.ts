'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MusicResponseDto as Music } from '@repo/dto';
import type { PlaylistDetail } from '@/hooks';
import { createPost } from '@/api';
import { DEFAULT_IMAGES } from '@/constants';
import { reorder } from '@/utils';
import { useFeedRefreshStore } from '@/stores';

type Options = {
  initialMusic?: Music;
  onSuccess: () => void;
};

type Return = {
  selectedMusics: Music[];
  content: string;
  setContent: (v: string) => void;

  searchQuery: string;
  setSearchQuery: (v: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (v: boolean) => void;

  activeCover: string;
  isSubmitDisabled: boolean;

  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddMusic: (music: Music) => void;
  onAddPlaylist: (playlist: PlaylistDetail) => void;
  onRemoveMusic: (id: string) => void;
  onMoveMusic: (index: number, direction: 'up' | 'down') => void;

  onSubmit: () => Promise<void>;
};

const isUuid = (id: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

const toMusicPayload = (m: Music) => ({
  id: isUuid(m.id) ? m.id : undefined,
  title: m.title,
  artistName: m.artistName,
  albumCoverUrl: m.albumCoverUrl,
  trackUri: m.trackUri,
  provider: m.provider,
  durationMs: m.durationMs,
});

export const useContentWrite = ({ initialMusic, onSuccess }: Options): Return => {
  const [selectedMusics, setSelectedMusics] = useState<Music[]>(initialMusic ? [initialMusic] : []);
  const [content, setContent] = useState('');

  const [customCoverPreview, setCustomCoverPreview] = useState<string | null>(null);
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeCover = useMemo(
    () => customCoverPreview || selectedMusics[0]?.albumCoverUrl || DEFAULT_IMAGES.ALBUM,
    [customCoverPreview, selectedMusics],
  );

  const isSubmitDisabled = selectedMusics.length === 0;

  useEffect(() => {
    return () => {
      if (customCoverPreview) URL.revokeObjectURL(customCoverPreview);
    };
  }, [customCoverPreview]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomCoverFile(file);

    const url = URL.createObjectURL(file);
    setCustomCoverPreview(url);

    e.target.value = '';
  };

  const closeSearch = () => {
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const onAddMusic = (music: Music) => {
    setSelectedMusics((prev) => {
      if (prev.some((m) => m.id === music.id)) return prev;
      return [...prev, music];
    });
    closeSearch();
  };

  const onAddPlaylist = (playlist: PlaylistDetail) => {
    setSelectedMusics((prev) => {
      const next = playlist.musics.filter((m) => !prev.some((p) => p.id === m.id));
      if (next.length === 0) return prev;
      return [...prev, ...next];
    });
    closeSearch();
  };

  const onRemoveMusic = (id: string) => {
    setSelectedMusics((prev) => prev.filter((m) => m.id !== id));
  };

  const onMoveMusic = (index: number, direction: 'up' | 'down') => {
    setSelectedMusics((prev) => reorder(prev, index, direction));
  };

  const onSubmit = async () => {
    const fd = new FormData();
    fd.append('content', content);

    fd.append('musics', JSON.stringify(selectedMusics.map(toMusicPayload)));

    if (customCoverFile) fd.append('coverImgUrl', customCoverFile);

    await createPost(fd);

    // 피드 무한스크롤 초기화/재조회 트리거
    useFeedRefreshStore.getState().bump();
    onSuccess();
  };

  return {
    selectedMusics,
    content,
    setContent,

    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,

    activeCover,
    isSubmitDisabled,

    onFileChange,
    onAddMusic,
    onAddPlaylist,
    onRemoveMusic,
    onMoveMusic,

    onSubmit,
  };
};
