import { ConfirmOverlay } from '@/components';
import { useModalStore, usePlayerStore, usePlaylistRefreshStore } from '@/stores';
import type { MusicRequestDto as UnsavedMusic, MusicResponseDto as SavedMusic, GetPlaylistDetailResDto } from '@repo/dto';
import { useEffect, useState } from 'react';
import { DEFAULT_IMAGES } from '@/constants';
import { Header, SearchDropdown, SongList, Toolbar } from './components';
import { addMusicsToPlaylist, changeMusicOrderOfPlaylist, deletePlaylist, editTitleOfPlaylist, getPlaylistDetail } from '@/api';
import { reorder } from '@/utils';

export default function PlaylistDetailModal({ playlistId }: { playlistId: string }) {
  const { closeModal } = useModalStore();

  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const playMusic = usePlayerStore((s) => s.playMusic);
  const bumpPlaylistRefresh = usePlaylistRefreshStore((s) => s.bump);

  const [playlist, setPlaylist] = useState<GetPlaylistDetailResDto | null>(null);
  const [songs, setSongs] = useState<SavedMusic[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const initialFetchPlaylist = async () => {
    const fetched = await getPlaylistDetail(playlistId);
    setPlaylist(fetched);
    setSongs(fetched.musics);
  };

  useEffect(() => {
    initialFetchPlaylist();
  }, []);

  // 이미 현재 재생 목록에 있는 곡들은 추가 안 됨
  const onPlayTotalSongs = () => {
    if (songs.length > 0) {
      addToQueue(songs);
      playMusic(songs[0]!);
    }
  };

  const toggleSelectSong = (songId: string) => {
    const newSelected = new Set(selectedSongIds);
    if (selectedSongIds.has(songId)) newSelected.delete(songId);
    else newSelected.add(songId);

    setSelectedSongIds(newSelected);
  };

  const requestChangeOrder = async () => {
    try {
      const songIds = songs.map((s) => s.id);
      await changeMusicOrderOfPlaylist(playlistId, songIds); // playlist.id?
      bumpPlaylistRefresh();
    } catch (e) {
      // 에러 처리
      throw e;
    }
  };

  const deleteSelectedSongs = async () => {
    // 낙관적 업데이트
    setSongs(songs.filter((s) => !selectedSongIds.has(s.id)));
    setSelectedSongIds(new Set());

    await requestChangeOrder();
  };

  const moveSong = async (index: number, direction: 'up' | 'down') => {
    // 낙관적 업데이트
    setSongs((prev) => reorder(prev, index, direction));

    await requestChangeOrder();
  };

  const handleAddSong = async (song: UnsavedMusic) => {
    // 낙관적 업데이트 x - song id가 필요해서 안 됨
    const { addedMusics } = await addMusicsToPlaylist(playlistId, [song]);
    setSongs([...songs, ...addedMusics]);
    bumpPlaylistRefresh();
  };

  const startRename = () => {
    if (!playlist) return;
    setDraftTitle(playlist.title);
    setIsEditingTitle(true);
  };

  const commitRename = async () => {
    if (!playlist) return;
    const nextTitle = draftTitle.trim();
    if (!nextTitle || nextTitle === playlist.title) {
      setIsEditingTitle(false);
      setDraftTitle(playlist.title);
      return;
    }
    await editTitleOfPlaylist(playlistId, nextTitle);
    setPlaylist({ ...playlist, title: nextTitle });
    setIsEditingTitle(false);
    bumpPlaylistRefresh();
  };

  const cancelRename = () => {
    if (playlist) setDraftTitle(playlist.title);
    setIsEditingTitle(false);
  };

  const requestDeletePlaylist = () => {
    setConfirmOpen(true);
  };

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
            isEditingTitle={isEditingTitle}
            draftTitle={draftTitle}
            onStartRename={startRename}
            onChangeTitle={setDraftTitle}
            onCommitRename={commitRename}
            onCancelRename={cancelRename}
            onDelete={requestDeletePlaylist}
          />

          {/* Search Dropdown Area */}
          {isSearchOpen && <SearchDropdown isSearchOpen={isSearchOpen} handleAddSong={handleAddSong} />}

          {/* Toolbar (Delete) */}
          {selectedSongIds.size > 0 && <Toolbar selectedSongIds={selectedSongIds} deleteSelectedSongs={deleteSelectedSongs} />}

          {/* Song List */}
          <SongList songs={songs} selectedSongIds={selectedSongIds} toggleSelectSong={toggleSelectSong} moveSong={moveSong} />
        </div>

        <ConfirmOverlay
          open={confirmOpen}
          title="플레이리스트를 삭제할까요?"
          confirmLabel="삭제"
          cancelLabel="취소"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setConfirmOpen(false);
            await deletePlaylist(playlistId);
            bumpPlaylistRefresh();
            closeModal();
          }}
        />
      </div>
    )
  );
}
