'use client';

import { LikeMusicsPlaylistItem, PlaylistItem } from './PlaylistItems';
import ArchiveViewHeader from './ArchiveViewHeader';
import { getAllPlaylists } from '@/api';
import { useEffect, useState } from 'react';
import type { PlaylistBriefResDto } from '@repo/dto';

export default function ArchiveView() {
  const [playlists, setPlaylists] = useState<PlaylistBriefResDto[]>([]);

  const fetchInitialPlaylists = async () => {
    setPlaylists(await getAllPlaylists());
  };

  useEffect(() => {
    fetchInitialPlaylists();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
      <div className="max-w-4xl mx-auto">
        {/* 페이지 헤더 */}
        <ArchiveViewHeader setPlaylists={setPlaylists} />

        {/* 플리 목록 */}
        <div className="flex flex-col space-y-4">
          {/* 좋아요 표시한 곡 목록 */}
          <LikeMusicsPlaylistItem />

          {/* 사용자의 플리 목록 */}
          {playlists.map((p) => (
            <PlaylistItem key={p.id} id={p.id} title={p.title} tracksCount={p.tracksCount} firstAlbumCoverUrl={p.firstAlbumCoverUrl} />
          ))}
        </div>
      </div>
    </div>
  );
}
