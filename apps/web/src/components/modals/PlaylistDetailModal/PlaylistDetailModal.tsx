import { ConfirmOverlay } from '@/components';
import { useModalStore, usePlayerStore } from '@/stores';
import type { MusicRequestDto as UnsavedMusic, MusicResponseDto as SavedMusic } from '@repo/dto';
import { useEffect, useState } from 'react';
import { DEFAULT_IMAGES, MAX_PLAYLIST_TITLE_LENGTH } from '@/constants';
import { Header, SearchDropdown, SongList, Toolbar } from './components';
import {
  useAddPlaylistSongMutation,
  useDeletePlaylistMutation,
  usePlaylistDetailQuery,
  usePlaylistSongsMutation,
  useRenamePlaylistMutation,
} from '@/hooks';
import { reorder } from '@/utils';
import { toast } from 'react-toastify';

export default function PlaylistDetailModal({ playlistId }: { playlistId: string }) {
  const { closeModal } = useModalStore();

  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const selectMusic = usePlayerStore((s) => s.selectMusic);

  const { data: playlist, isError } = usePlaylistDetailQuery(playlistId);
  // 로컬 state로 복사하지 않는다. 편집 결과는 mutation이 cache를 갱신해 여기로 되돌아온다.
  const songs: SavedMusic[] = playlist?.musics ?? [];

  const { mutate: replaceSongs } = usePlaylistSongsMutation({ playlistId });
  const { mutate: addSong } = useAddPlaylistSongMutation({ playlistId });
  const { mutate: renamePlaylist } = useRenamePlaylistMutation({ playlistId });
  const { mutate: removePlaylist } = useDeletePlaylistMutation({ playlistId, onDeleted: closeModal });

  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [isInvalidTitle, setIsInvalidTitle] = useState(false);

  useEffect(() => {
    if (!isError) return;
    toast.error('플레이리스트 정보를 불러오지 못했습니다.');
  }, [isError]);

  const onPlayTotalSongs = () => {
    if (songs.length > 0) {
      addToQueue(songs);
      selectMusic(songs[0]!);
    }
  };

  const toggleSelectSong = (songId: string) => {
    const newSelected = new Set(selectedSongIds);
    if (selectedSongIds.has(songId)) newSelected.delete(songId);
    else newSelected.add(songId);

    setSelectedSongIds(newSelected);
  };

  /** 낙관적 반영과 실패 시 롤백은 mutation이 담당한다. 여기서는 바뀐 목록만 넘긴다. */
  const requestChangeOrder = (nextSongs: SavedMusic[]) => {
    replaceSongs(nextSongs, { onError: () => toast.error('변경사항 반영에 실패했습니다.') });
  };

  const deleteSelectedSongs = () => {
    const nextSongs = songs.filter((s) => !selectedSongIds.has(s.id));
    setSelectedSongIds(new Set());

    requestChangeOrder(nextSongs);
  };

  const moveSong = (index: number, direction: 'up' | 'down') => {
    requestChangeOrder(reorder(songs, index, direction));
  };

  const moveSongTo = (from: number, to: number) => {
    if (from === to) return;
    if (from < 0 || from >= songs.length) return;
    if (to < 0 || to >= songs.length) return;

    const nextSongs = [...songs];
    const [item] = nextSongs.splice(from, 1);
    if (!item) return;
    nextSongs.splice(to, 0, item);

    requestChangeOrder(nextSongs);
  };

  const handleAddSong = (song: UnsavedMusic) => {
    addSong(song, { onError: () => toast.error('곡 추가에 실패했습니다.') });
  };

  const startRename = () => {
    if (!playlist) return;
    setDraftTitle(playlist.title);
    setIsEditingTitle(true);
  };

  const validateRename = (title: string) => {
    return title.trim().length <= MAX_PLAYLIST_TITLE_LENGTH;
  };

  const commitRename = () => {
    if (!playlist) return;
    if (isInvalidTitle) return;

    const nextTitle = draftTitle.trim();
    if (!nextTitle || nextTitle === playlist.title) {
      setIsEditingTitle(false);
      setDraftTitle(playlist.title);
      return;
    }

    setIsEditingTitle(false);
    renamePlaylist(nextTitle, { onError: () => toast.error('플레이리스트 이름 변경에 실패했습니다.') });
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
          onConfirm={() => {
            setConfirmOpen(false);
            removePlaylist(undefined, { onError: () => toast.error('플레이리스트 삭제에 실패했습니다.') });
          }}
        />
      </div>
    )
  );
}
