import { useModalStore } from '@/stores';
import type { MusicRequestDto as UnsavedMusic, MusicResponseDto as SavedMusic, GetPlaylistDetailResDto } from '@repo/dto';
import { useEffect, useState } from 'react';
import { DEFAULT_IMAGES } from '@/constants';
import { Header, SearchDropdown, SongList, Toolbar } from './components';
import { getPlaylistDetail } from '@/api';

export function PlaylistDetailModal({ playlistId }: { playlistId: string }) {
  const { closeModal } = useModalStore();

  const [playlist, setPlaylist] = useState<GetPlaylistDetailResDto | null>(null);
  const [songs, setSongs] = useState<SavedMusic[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const initialFetchPlaylist = async () => {
    const fetched = await getPlaylistDetail(playlistId);
    setPlaylist(fetched);
    setSongs(fetched.musics);
  };

  useEffect(() => {
    initialFetchPlaylist();
  }, []);

  // todo
  const onPlaySong = (song: SavedMusic) => {};
  const onPlayTotalSongs = () => {};
  const toggleSelectSong = (musicId: string) => {};
  const deleteSelectedSongs = () => {};
  const moveSong = (index: number, direction: 'up' | 'down') => {};
  const handleAddSong = (song: UnsavedMusic) => {};

  return (
    playlist && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-[8px_8px_0px_0px_#00214D] border-2 border-primary flex flex-col max-h-[85vh] overflow-hidden">
          {/* Header Section */}
          <Header
            title={playlist.title}
            tracksCount={songs.length}
            coverImgUrl={songs[0]?.albumCoverUrl || DEFAULT_IMAGES.ALBUM}
            onClose={closeModal}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            onPlayTotalSongs={onPlayTotalSongs}
          />

          {/* Search Dropdown Area */}
          {isSearchOpen && <SearchDropdown handleAddSong={handleAddSong} />}

          {/* Toolbar (Delete) */}
          {selectedSongIds.size > 0 && <Toolbar selectedSongIds={selectedSongIds} deleteSelectedSongs={deleteSelectedSongs} />}

          {/* Song List */}
          <SongList songs={songs} selectedSongIds={selectedSongIds} toggleSelectSong={toggleSelectSong} onPlaySong={onPlaySong} moveSong={moveSong} />
        </div>
      </div>
    )
  );
}
