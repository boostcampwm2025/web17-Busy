'use client';

import { PlaylistItem } from './PlaylistItems';
import ArchiveViewHeader from './ArchiveViewHeader';
import { usePlaylistsQuery } from '@/hooks/playlist/use-playlists-query';
import { useDeletePlaylistInListMutation, useRenamePlaylistInListMutation } from '@/hooks/playlist/use-playlist-mutations';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function ArchiveView() {
  const { data: playlists = [], isError } = usePlaylistsQuery();
  const renamePlaylist = useRenamePlaylistInListMutation();
  const deletePlaylist = useDeletePlaylistInListMutation();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (isError) {
      toast.error('플레이리스트 목록을 불러오지 못했습니다.');
    }
  }, [isError]);

  const handleRename = async (id: string, title: string) => {
    renamePlaylist.mutate({ playlistId: id, title }, { onError: () => toast.error('플레이리스트 이름 변경에 실패했습니다.') });
  };

  const handleDelete = async (id: string) => {
    deletePlaylist.mutate(id, { onError: () => toast.error('플레이리스트 삭제에 실패했습니다.') });
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
