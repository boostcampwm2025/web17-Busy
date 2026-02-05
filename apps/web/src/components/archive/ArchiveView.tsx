'use client';

import { PlaylistItem } from './PlaylistItems';
import ArchiveViewHeader from './ArchiveViewHeader';
import { deletePlaylist, editTitleOfPlaylist, getAllPlaylists } from '@/api';
import { usePlaylistRefreshStore } from '@/stores';
import { useEffect, useState } from 'react';
import type { PlaylistBriefResDto } from '@repo/dto';
import { toast } from 'react-toastify';

export default function ArchiveView() {
  const [playlists, setPlaylists] = useState<PlaylistBriefResDto[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const playlistNonce = usePlaylistRefreshStore((s) => s.nonce);
  const bumpPlaylistRefresh = usePlaylistRefreshStore((s) => s.bump);

  const fetchInitialPlaylists = async () => {
    try {
      setPlaylists(await getAllPlaylists());
    } catch (e) {
      toast.error('플레이리스트 목록을 불러오지 못했습니다.');
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInitialPlaylists();
  }, [playlistNonce]);

  const handleRename = async (id: string, title: string) => {
    try {
      await editTitleOfPlaylist(id, title);
      bumpPlaylistRefresh();
    } catch (e) {
      toast.error('플레이리스트 이름 변경에 실패했습니다.');
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlaylist(id);
      bumpPlaylistRefresh();
    } catch (e) {
      toast.error('플레이리스트 삭제에 실패했습니다.');
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* 페이지 헤더 */}
      <ArchiveViewHeader />

      {/* 플리 목록 */}
      <div className="w-full flex flex-col space-y-4">
        {/* 사용자의 플리 목록 */}
        {playlists.map((p) => (
          <PlaylistItem
            key={p.id}
            id={p.id}
            title={p.title}
            tracksCount={p.tracksCount}
            firstAlbumCoverUrl={p.firstAlbumCoverUrl}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
