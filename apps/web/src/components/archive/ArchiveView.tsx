'use client';

import { LikeMusicsPlaylistItem, PlaylistItem } from './PlaylistItems';
import ArchiveViewHeader from './ArchiveViewHeader';
import { deletePlaylist, editTitleOfPlaylist, getAllPlaylists } from '@/api';
import { usePlaylistRefreshStore } from '@/stores';
import { useEffect, useState } from 'react';
import type { PlaylistBriefResDto } from '@repo/dto';

export default function ArchiveView() {
  const [playlists, setPlaylists] = useState<PlaylistBriefResDto[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const playlistNonce = usePlaylistRefreshStore((s) => s.nonce);
  const bumpPlaylistRefresh = usePlaylistRefreshStore((s) => s.bump);

  const fetchInitialPlaylists = async () => {
    setPlaylists(await getAllPlaylists());
  };

  useEffect(() => {
    fetchInitialPlaylists();
  }, [playlistNonce]);

  const handleRename = async (id: string, title: string) => {
    await editTitleOfPlaylist(id, title);
    bumpPlaylistRefresh();
  };

  const handleDelete = async (id: string) => {
    await deletePlaylist(id);
    bumpPlaylistRefresh();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* 페이지 헤더 */}
      <ArchiveViewHeader />

      {/* 플리 목록 */}
      <div className="w-full flex flex-col space-y-4">
        {/* 좋아요 표시한 곡 목록 */}
        <LikeMusicsPlaylistItem />

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
