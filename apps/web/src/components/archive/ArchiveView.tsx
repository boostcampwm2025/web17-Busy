'use client';

import PlaylistItem from './playlist-item/PlaylistItem';
import LikeMusicsPlaylistItem from './playlist-item/LikePlaylistItem';
import ArchiveViewHeader from './ArchiveViewHeader';

export default function ArchiveView() {
  const ids = ['플리 1', '플리 2', '플리 3', '플리 4', '플리 5'];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
      <div className="max-w-4xl mx-auto">
        {/* 페이지 헤더 */}
        <ArchiveViewHeader />

        {/* 플리 목록 */}
        <div className="flex flex-col space-y-4">
          <LikeMusicsPlaylistItem />
          {ids.map((id) => (
            <PlaylistItem
              id={id}
              title={'짭 플리'}
              tracksCount={123}
              firstAlbumCoverUrl={'https://i.scdn.co/image/ab67616d00004851b62a7d11f28702ade7c5aa3f'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
