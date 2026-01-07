import React from 'react';
import { Search, Sparkles, Library, Music as MusicIcon } from 'lucide-react';
import { Music, Playlist } from '@/types';

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
  const hasSearchQuery = searchQuery.trim().length > 0;

  // 실제 필터링 로직 (API 연동 시 여기서 호출하거나 상위에서 받아옴)
  const filteredMusics = MOCK_MUSICS.filter(
    (s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artistName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="relative mb-6">
      <label className="text-sm font-bold text-gray-1 mb-2 block">음악 검색</label>
      <div className="relative z-20">
        <input
          type="text"
          placeholder="어떤 음악을 공유하고 싶나요?"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearchOpen(true);
          }}
          onFocus={() => setIsSearchOpen(true)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-primary text-primary placeholder:text-gray-2 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-accent-cyan transition-all font-medium"
        />
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-2" />
      </div>

      {/* 드롭다운 영역 */}
      {isSearchOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsSearchOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-primary rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar z-20 py-2">
            {/* 1. 플레이리스트 (검색어 없을 때) */}
            {!hasSearchQuery && (
              <>
                <div className="px-4 py-2 flex items-center text-xs font-bold text-accent-cyan uppercase tracking-wider bg-gray-4/50 border-b border-gray-3 mb-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  추천 (내 플레이리스트)
                </div>

                {MOCK_PLAYLISTS.length > 0 ? (
                  MOCK_PLAYLISTS.map((playlist) => (
                    <button
                      key={playlist.playlistId}
                      onClick={() => onAddPlaylist(playlist)}
                      className="w-full flex items-center px-4 py-3 hover:bg-gray-4 transition-colors text-left group"
                    >
                      <div className="relative mr-4">
                        <div className="absolute top-1 -right-1 w-10 h-10 bg-gray-2 border border-gray-3 rounded-lg transform rotate-6"></div>
                        <div className="absolute top-0.5 1right-0.5 w-10 h-10 bg-gray-3 border border-gray-3 rounded-lg transform rotate-3"></div>
                        <img
                          src={playlist.musics[0]?.albumCoverUrl}
                          alt="playlist"
                          className="relative w-10 h-10 rounded-lg border border-gray-3 object-cover z-10"
                        />
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
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-2 text-sm">보관함이 비어있습니다.</div>
                )}
              </>
            )}

            {/* 2. 검색 결과 (검색어 있을 때) */}
            {hasSearchQuery && (
              <>
                <div className="px-4 py-2 flex items-center text-xs font-bold text-gray-1 uppercase tracking-wider bg-gray-4/50 border-b border-gray-3 mb-1">
                  <MusicIcon className="w-3 h-3 mr-1" />
                  검색 결과
                </div>
                {filteredMusics.length > 0 ? (
                  filteredMusics.map((music) => (
                    <button
                      key={music.musicId}
                      onClick={() => onAddMusic(music)}
                      className="w-full flex items-center px-4 py-2 hover:bg-gray-4 transition-colors text-left group"
                    >
                      <img src={music.albumCoverUrl} alt="art" className="w-10 h-10 rounded object-cover mr-3 border border-gray-3" />
                      <div>
                        <p className="font-bold text-sm text-primary group-hover:text-accent-cyan transition-colors">{music.title}</p>
                        <p className="text-xs text-gray-1">{music.artistName}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-2 text-sm">검색 결과가 없습니다.</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
