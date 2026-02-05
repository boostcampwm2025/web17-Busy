import { ConfirmOverlay } from '@/components';
import { useModalStore, usePlayerStore, usePlaylistRefreshStore } from '@/stores';
import type { MusicRequestDto as UnsavedMusic, MusicResponseDto as SavedMusic, GetPlaylistDetailResDto } from '@repo/dto';
import { useEffect, useState } from 'react';
import { DEFAULT_IMAGES, MAX_PLAYLIST_TITLE_LENGTH } from '@/constants';
import { Header, SearchDropdown, SongList, Toolbar } from './components';
import { addMusicsToPlaylist, changeMusicOrderOfPlaylist, deletePlaylist, editTitleOfPlaylist, getPlaylistDetail } from '@/api';
import { reorder } from '@/utils';
import { toast } from 'react-toastify';

export default function PlaylistDetailModal({ playlistId }: { playlistId: string }) {
  const { closeModal } = useModalStore();

  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const playMusic = usePlayerStore((s) => s.playMusic);
  const bumpPlaylistRefresh = usePlaylistRefreshStore((s) => s.bump);

  const [playlist, setPlaylist] = useState<GetPlaylistDetailResDto | null>(null);
  const [songs, setSongs] = useState<SavedMusic[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [isInvalidTitle, setIsInvalidTitle] = useState(false);

  const initialFetchPlaylist = async () => {
    const fetched = await getPlaylistDetail(playlistId);
    setPlaylist(fetched);
    setSongs(fetched.musics);
  };

  useEffect(() => {
    initialFetchPlaylist();
  }, [playlistId]);

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

  const requestChangeOrder = async (nextSongs: SavedMusic[]) => {
    try {
      const songIds = nextSongs.map((s) => s.id);
      await changeMusicOrderOfPlaylist(playlistId, songIds); // playlist.id?
      bumpPlaylistRefresh();
    } catch (e) {
      toast.error('변경사항 반영에 실패했습니다.');
      console.error(e);
    }
  };

  const deleteSelectedSongs = async () => {
    // 낙관적 업데이트
    const nextSongs = songs.filter((s) => !selectedSongIds.has(s.id));
    setSongs(nextSongs);
    setSelectedSongIds(new Set());

    await requestChangeOrder(nextSongs);
  };

  const moveSong = async (index: number, direction: 'up' | 'down') => {
    // 낙관적 업데이트
    const nextSongs = reorder(songs, index, direction);
    setSongs(nextSongs);

    await requestChangeOrder(nextSongs);
  };

  const moveSongTo = async (from: number, to: number) => {
    if (from === to) return;
    if (from < 0 || from >= songs.length) return;
    if (to < 0 || to >= songs.length) return;

    const nextSongs = [...songs];
    const [item] = nextSongs.splice(from, 1);
    if (!item) return;
    nextSongs.splice(to, 0, item);

    setSongs(nextSongs);
    await requestChangeOrder(nextSongs);
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

  const validateRename = (title: string) => {
    return title.trim().length <= MAX_PLAYLIST_TITLE_LENGTH;
  };

  const commitRename = async () => {
    if (!playlist) return;
    if (isInvalidTitle) return;

    const nextTitle = draftTitle.trim();
    if (!nextTitle || nextTitle === playlist.title) {
      setIsEditingTitle(false);
      setDraftTitle(playlist.title);
      return;
    }
    await editTitleOfPlaylist(playlistId, nextTitle);
    setPlaylist({ ...playlist, title: nextTitle });
    setIsEditingTitle(false);
    setIsInvalidTitle(false);
    bumpPlaylistRefresh();
  };

  const cancelRename = () => {
    if (playlist) setDraftTitle(playlist.title);
    setIsEditingTitle(false);
    setIsInvalidTitle(false);
  };

  const requestDeletePlaylist = () => {
    setConfirmOpen(true);
  };

  useEffect(() => {
    const isInValid = !validateRename(draftTitle);
    isInvalidTitle !== isInValid && setIsInvalidTitle(isInValid);
  }, [draftTitle]);

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
            onPlayTotalSongs={onPlayTotalSongs}
            isEditingTitle={isEditingTitle}
            draftTitle={draftTitle}
            isInvalidTitle={isInvalidTitle}
            onStartRename={startRename}
            onChangeTitle={setDraftTitle}
            onCommitRename={commitRename}
            onCancelRename={cancelRename}
            onDelete={requestDeletePlaylist}
          />

          {/* Search Dropdown Area */}
          {<SearchDropdown handleAddSong={handleAddSong} />}

          {/* Toolbar (Delete) */}
          {selectedSongIds.size > 0 && <Toolbar selectedSongIds={selectedSongIds} deleteSelectedSongs={deleteSelectedSongs} />}

          {/* Song List */}
          <SongList songs={songs} selectedSongIds={selectedSongIds} toggleSelectSong={toggleSelectSong} moveSong={moveSong} moveSongTo={moveSongTo} />
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
