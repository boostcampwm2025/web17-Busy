'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MusicResponseDto as Music } from '@repo/dto';

import type { PlaylistDetail } from '@/hooks';
import { createPost } from '@/api';
import { DEFAULT_IMAGES } from '@/constants';
import { reorder } from '@/utils';
import { useFeedRefreshStore } from '@/stores';

type Options = {
  /**
   * 기존 호출부 유지
   */
  initialMusic?: Music;

  /** 다곡 초기값 */
  initialMusics?: Music[];

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

const uniqById = (items: Music[]): Music[] => {
  const seen = new Set<string>();
  const out: Music[] = [];
  for (const m of items) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
};

const toInitialSelected = (initialMusics?: Music[], initialMusic?: Music): Music[] => {
  if (Array.isArray(initialMusics) && initialMusics.length > 0) {
    return uniqById(initialMusics);
  }
  return initialMusic ? [initialMusic] : [];
};

const toMusicPayload = (m: Music) => ({
  // NOTE: iTunes 검색 결과 id는 외부 trackId일 수 있으므로 UUID만 id로 전송
  id: isUuid(m.id) ? m.id : undefined,
  title: m.title,
  artistName: m.artistName,
  albumCoverUrl: m.albumCoverUrl,
  trackUri: m.trackUri,
  provider: m.provider,
  durationMs: m.durationMs,
});

export const useContentWrite = ({ initialMusic, initialMusics, onSuccess }: Options): Return => {
  const [selectedMusics, setSelectedMusics] = useState<Music[]>(() => toInitialSelected(initialMusics, initialMusic));
  const [content, setContent] = useState('');

  const [customCoverPreview, setCustomCoverPreview] = useState<string | null>(null);
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 모달이 "다른 initialMusics"로 다시 열릴 수 있으므로, props 변화에 맞춰 초기화
  useEffect(() => {
    setSelectedMusics(toInitialSelected(initialMusics, initialMusic));
    setContent('');
    setSearchQuery('');
    setIsSearchOpen(false);

    setCustomCoverFile(null);
    setCustomCoverPreview(null);
  }, [initialMusic, initialMusics]);

  const activeCover = useMemo(
    () => customCoverPreview || selectedMusics[0]?.albumCoverUrl || DEFAULT_IMAGES.ALBUM,
    [customCoverPreview, selectedMusics],
  );

  const isSubmitDisabled = selectedMusics.length === 0;

  // blob url revoke (메모리 누수 방지)
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

    // 같은 파일 다시 선택 가능하게
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

  const dedupePlaylistMusic = (prevList: Music[], newList: Music[]) => newList.filter((m) => !prevList.some((p) => p.id === m.id));

  const onAddPlaylist = (playlist: PlaylistDetail) => {
    setSelectedMusics((prev) => {
      const next = dedupePlaylistMusic(prev, playlist.musics);
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
    const trimmed = content.trim();

    const fd = new FormData();
    fd.append('content', trimmed);

    // 서버가 musics를 JSON string으로 받는 전제(CreatePostMultipartDto)
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
