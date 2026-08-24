import type { MusicResponseDto as SavedMusic } from '@repo/dto';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

import { usePlaylistDetailQuery } from '@/hooks/playlist/use-playlist-detail-query';
import { usePlaylistSongsEditing } from '@/hooks/playlist/use-playlist-songs-editing';
import { useModalStore } from '@/stores/useModalStore';
import { ModalShell } from '@/components/common/ModalShell';
import { Header, SearchDropdown, SongList, Toolbar } from './partials';

export default function PlaylistDetailModal({ playlistId }: { playlistId: string }) {
  const closeModal = useModalStore((s) => s.closeModal);

  const { data: playlist, isError } = usePlaylistDetailQuery(playlistId);
  // 로컬 state로 복사하지 않는다. 편집 결과는 mutation이 cache를 갱신해 여기로 되돌아온다.
  const songs: SavedMusic[] = playlist?.musics ?? [];

  const { selectedSongIds, toggleSelectSong, deleteSelectedSongs, moveSong, moveSongTo, addSong } = usePlaylistSongsEditing({
    playlistId,
    songs,
    onReorderError: () => toast.error('변경사항 반영에 실패했습니다.'),
    onAddError: () => toast.error('곡 추가에 실패했습니다.'),
  });

  useEffect(() => {
    if (!isError) return;
    toast.error('플레이리스트 정보를 불러오지 못했습니다.');
  }, [isError]);

  return (
    playlist && (
      <ModalShell onClose={closeModal} size="lg" cardClassName="max-h-[85vh]">
        <Header playlistId={playlistId} />

        <SearchDropdown handleAddSong={addSong} />

        {selectedSongIds.size > 0 && <Toolbar selectedSongIds={selectedSongIds} deleteSelectedSongs={deleteSelectedSongs} />}

        <SongList songs={songs} selectedSongIds={selectedSongIds} toggleSelectSong={toggleSelectSong} moveSong={moveSong} moveSongTo={moveSongTo} />
      </ModalShell>
    )
  );
}
