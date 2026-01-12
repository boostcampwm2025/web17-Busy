'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Sparkles, Library, Music as MusicIcon } from 'lucide-react';
import type { Music, Playlist } from '@/types';
import { searchItunesSongs } from '@/api';
import { itunesSongToMusic } from '@/mappers';
import { useDebouncedValue } from '@/hooks';

type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 20;
const COUNTRY: 'KR' = 'KR';

// 목업 데이터 | 음악, {내 플레이리스트}
const MOCK_MUSICS: Music[] = [
  {
    musicId: '1',
    title: 'we cant be friends',
    artistName: 'Ariana Grande',
    albumCoverUrl: 'https://picsum.photos/seed/art3/400/400',
    trackUri: 'https://i.scdn.co/image/ab67616d0000b27390635da24c3031d277a83d09',
    provider: 'SPOTIFY',
    durationMs: 300,
  },
  {
    musicId: '2',
    title: 'Die For You',
    artistName: 'The Weekend',
    albumCoverUrl: 'https://picsum.photos/seed/art8/400/400',
    trackUri: 'https://i.scdn.co/image/ab67616d0000b27390635da24c3031d277a83d09',
    provider: 'SPOTIFY',
    durationMs: 300,
  },
  {
    musicId: '3',
    title: 'Ditto',
    artistName: 'NewJeans',
    albumCoverUrl: 'https://picsum.photos/seed/art9/400/400',
    trackUri: 'https://i.scdn.co/image/ab67616d0000b27390635da24c3031d277a83d09',
    provider: 'SPOTIFY',
    durationMs: 300,
  },
];

const MOCK_PLAYLISTS: Playlist[] = [
  {
    playlistId: 'p1',
    title: '비 오는 날 듣기 좋은 노래',
    musics: [MOCK_MUSICS[0]!, MOCK_MUSICS[1]!],
  },
  {
    playlistId: 'p2',
    title: '노동요',
    musics: [MOCK_MUSICS[2]!],
  },
];

interface MusicSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  onAddMusic: (music: Music) => void;
  onAddPlaylist: (playlist: Playlist) => void;
}

export const MusicSearch = ({ searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen, onAddMusic, onAddPlaylist }: MusicSearchProps) => {
  const debouncedQuery = useDebouncedValue(searchQuery, DEBOUNCE_MS);
  const trimmed = useMemo(() => debouncedQuery.trim(), [debouncedQuery]);

  const [status, setStatus] = useState<SearchStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<Music[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isSearchOpen) {
      abortRef.current?.abort();
      abortRef.current = null;
      setStatus('idle');
      setErrorMessage(null);
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = null;

    if (trimmed.length === 0) {
      setStatus('idle');
      setErrorMessage(null);
      setResults([]);
      return;
    }

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setStatus('idle');
      setErrorMessage(null);
      setResults([]);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setErrorMessage(null);

    let isActive = true;

    const run = async () => {
      try {
        const data = await searchItunesSongs({
          keyword: trimmed,
          limit: DEFAULT_LIMIT,
          country: COUNTRY,
          signal: controller.signal,
        });

        const mapped = data.results
          .map(itunesSongToMusic)
          // previewUrl(=trackUri)가 없는 곡은 미리듣기 불가 -> 제외(정책)
          .filter((m) => m.trackUri.trim().length > 0);

        if (!isActive) return;

        setResults(mapped);
        setStatus(mapped.length > 0 ? 'success' : 'empty');
      } catch (e) {
        if (!isActive) return;

        const err = e as { name?: string; message?: string };
        if (err?.name === 'AbortError') return;

        setResults([]);
        setStatus('error');
        setErrorMessage(err?.message ?? '검색 중 오류가 발생했습니다.');
      }
    };

    void run();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isSearchOpen, trimmed]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearchOpen(true);
  };

  const handleInputFocus = () => {
    setIsSearchOpen(true);
  };

  const handleCloseDropdown = () => {
    setIsSearchOpen(false);
  };

  const handleAddPlaylistClick = (playlist: Playlist) => {
    onAddPlaylist(playlist);
  };

  const handleAddMusicClick = (music: Music) => {
    onAddMusic(music);
  };

  const renderBody = () => {
    const hasQuery = trimmed.length > 0;

    if (!hasQuery) {
      return (
        <>
          <div className="px-4 py-2 flex items-center text-xs font-bold text-accent-cyan uppercase tracking-wider bg-gray-4/50 border-b border-gray-3 mb-1">
            <Sparkles className="w-3 h-3 mr-1" />
            추천 (내 플레이리스트)
          </div>

          {MOCK_PLAYLISTS.length > 0 ? (
            MOCK_PLAYLISTS.map((playlist) => {
              const coverUrl = playlist.musics[0]?.albumCoverUrl;

              return (
                <button
                  key={playlist.playlistId}
                  type="button"
                  onClick={() => handleAddPlaylistClick(playlist)}
                  className="w-full flex items-center px-4 py-3 hover:bg-gray-4 transition-colors text-left group"
                >
                  {/* 첫 번째 곡 커버를 대표 이미지로 사용 */}
                  <div className="relative mr-4">
                    <div className="absolute top-1 -right-1 w-10 h-10 bg-gray-2 border border-gray-3 rounded-lg rotate-6" />
                    <div className="absolute top-0.5 -right-0.5 w-10 h-10 bg-gray-3 border border-gray-3 rounded-lg rotate-3" />

                    {coverUrl ? (
                      <img src={coverUrl} alt="playlist-cover" className="relative w-10 h-10 rounded-lg border border-gray-3 object-cover z-10" />
                    ) : (
                      <div className="relative w-10 h-10 rounded-lg border border-gray-3 bg-white z-10 flex items-center justify-center">
                        <Library className="w-4 h-4 text-gray-1" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-primary truncate group-hover:text-accent-cyan transition-colors">{playlist.title}</p>
                    <div className="flex items-center text-xs text-gray-1 mt-0.5">
                      <Library className="w-3 h-3 mr-1" />
                      <span>{playlist.musics.length}곡</span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-gray-2 px-2 py-1 border border-gray-3 rounded group-hover:bg-white group-hover:text-primary group-hover:border-primary transition-colors">
                    선택
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-2 text-sm">보관함이 비어있습니다.</div>
          )}
        </>
      );
    }

    if (trimmed.length < MIN_QUERY_LENGTH) {
      return <div className="p-4 text-center text-gray-2 text-sm">2글자 이상 입력해주세요.</div>;
    }

    if (status === 'loading') {
      return <div className="p-4 text-center text-gray-2 text-sm">검색 중...</div>;
    }

    if (status === 'error') {
      return <div className="p-4 text-center text-gray-2 text-sm">{errorMessage ?? '검색 중 오류가 발생했습니다.'}</div>;
    }

    if (status === 'empty') {
      return <div className="p-4 text-center text-gray-2 text-sm">검색 결과가 없습니다.</div>;
    }

    return (
      <>
        <div className="px-4 py-2 flex items-center text-xs font-bold text-gray-1 uppercase tracking-wider bg-gray-4/50 border-b border-gray-3 mb-1">
          <MusicIcon className="w-3 h-3 mr-1" />
          검색 결과
        </div>

        {results.map((music) => (
          <button
            key={music.musicId}
            type="button"
            onClick={() => handleAddMusicClick(music)}
            className="w-full flex items-center px-4 py-2 hover:bg-gray-4 transition-colors text-left group"
          >
            <img src={music.albumCoverUrl} alt="art" className="w-10 h-10 rounded object-cover mr-3 border border-gray-3" />
            <div className="min-w-0">
              <p className="font-bold text-sm text-primary truncate group-hover:text-accent-cyan transition-colors">{music.title}</p>
              <p className="text-xs text-gray-1 truncate">{music.artistName}</p>
            </div>
          </button>
        ))}
      </>
    );
  };

  return (
    <div className="relative mb-6">
      <label className="text-sm font-bold text-gray-1 mb-2 block">음악 검색</label>

      <div className="relative z-20">
        <input
          type="text"
          placeholder="어떤 음악을 공유하고 싶나요?"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-primary text-primary placeholder:text-gray-2
                     focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-accent-cyan transition-all font-medium"
        />
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-2" />
      </div>

      {isSearchOpen ? (
        <>
          <button type="button" className="fixed inset-0 z-10" onClick={handleCloseDropdown} aria-label="close-search-dropdown" />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-primary rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar z-20 py-2">
            {renderBody()}
          </div>
        </>
      ) : null}
    </div>
  );
};
