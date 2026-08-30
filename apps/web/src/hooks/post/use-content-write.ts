import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { MusicResponseDto as Music } from '@repo/dto';

import type { PlaylistDetail } from '../playlist/use-playlist-recommendations';
import { createPost } from '@/api/internal/post';
import { DEFAULT_IMAGES } from '@/constants/defaultImages';
import { invalidatePostListCaches } from './post-cache-updaters';
import { usePostCoverImage } from './use-post-cover-image';
import { usePostMusicSelection } from './use-post-music-selection';

type Options = {
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
  onAddMusic: (music: Music) => Promise<void>;
  onAddPlaylist: (playlist: PlaylistDetail) => void;
  onRemoveMusic: (id: string) => void;
  onMoveMusic: (index: number, direction: 'up' | 'down') => void;

  onSubmit: () => Promise<void>;
};

const isUuid = (id: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

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

/** 곡 선택·커버·검색창·본문을 조립해 게시글 하나를 만든다. 각 조각의 상태는 전용 훅이 소유한다. */
export const useContentWrite = ({ initialMusics, onSuccess }: Options): Return => {
  const queryClient = useQueryClient();

  const { selectedMusics, addMusic, addMusics, removeMusic, moveMusic, reset: resetSelection } = usePostMusicSelection({ initialMusics });
  const { coverFile, previewUrl, handleFileChange, reset: resetCover } = usePostCoverImage();

  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const closeSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearchOpen(false);
  }, []);

  // 모달이 "다른 initialMusics"로 다시 열릴 수 있으므로, props 변화에 맞춰 초기화.
  // resetSelection이 initialMusics에 묶여 있어 이 effect도 그때만 다시 돈다.
  useEffect(() => {
    resetSelection();
    resetCover();
    setContent('');
    closeSearch();
  }, [resetSelection, resetCover, closeSearch]);

  const activeCover = useMemo(() => previewUrl || selectedMusics[0]?.albumCoverUrl || DEFAULT_IMAGES.ALBUM, [previewUrl, selectedMusics]);

  const isSubmitDisabled = selectedMusics.length === 0;

  const onAddMusic = useCallback(
    async (music: Music) => {
      await addMusic(music);
      closeSearch();
    },
    [addMusic, closeSearch],
  );

  const onAddPlaylist = useCallback(
    (playlist: PlaylistDetail) => {
      addMusics(playlist.musics);
      closeSearch();
    },
    [addMusics, closeSearch],
  );

  const onSubmit = useCallback(async () => {
    const fd = new FormData();
    fd.append('content', content.trim());

    // 서버가 musics를 JSON string으로 받는 전제(CreatePostMultipartDto)
    fd.append('musics', JSON.stringify(selectedMusics.map(toMusicPayload)));

    if (coverFile) fd.append('coverImgUrl', coverFile);

    await createPost(fd);
    invalidatePostListCaches(queryClient);

    onSuccess();
  }, [content, selectedMusics, coverFile, queryClient, onSuccess]);

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

    onFileChange: handleFileChange,
    onAddMusic,
    onAddPlaylist,
    onRemoveMusic: removeMusic,
    onMoveMusic: moveMusic,

    onSubmit,
  };
};
