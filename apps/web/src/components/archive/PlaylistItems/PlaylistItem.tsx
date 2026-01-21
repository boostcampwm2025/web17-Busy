import { DEFAULT_IMAGES } from '@/constants';
import { MODAL_TYPES, useModalStore } from '@/stores';
import type { PlaylistBriefResDto as Playlist } from '@repo/dto';
import { ChevronRight, Library } from 'lucide-react';

export default function PlaylistItem(playlist: Playlist) {
  const openModal = useModalStore((s) => s.openModal);

  // 플리 상세 모달 열기
  const handlePlaylistClick = () => {
    openModal(MODAL_TYPES.PLAYLIST_DETAIL, { playlistId: playlist.id });
  };

  return (
    <div
      onClick={handlePlaylistClick}
      className="group flex items-center bg-white border-2 border-primary rounded-xl p-4 cursor-pointer hover:bg-gray-50 hover:shadow-[6px_6px_0px_0px_#00EBC7] hover:-translate-y-1 transition-all duration-200"
    >
      {/* 플리 첫 곡 앨범 커버 이미지 부분 */}
      <div className="relative w-16 h-16 mr-6 flex-shrink-0">
        <div className="absolute top-0 right-0 w-full h-full bg-primary/20 rounded-lg transform rotate-6 border border-primary/20 transition-transform group-hover:rotate-12"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-white rounded-lg border border-primary/20 transform rotate-3"></div>
        <img
          src={playlist.firstAlbumCoverUrl || DEFAULT_IMAGES.ALBUM}
          alt={playlist.title}
          className="relative w-full h-full object-cover rounded-lg border-2 border-primary z-10"
        />
      </div>

      {/* 플리 정보 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-black text-primary truncate group-hover:text-accent-pink transition-colors">{playlist.title}</h3>
        <p className="text-sm font-bold text-gray-400 mt-1 flex items-center">
          <Library className="w-4 h-4 mr-1" />
          {playlist.tracksCount}곡 저장됨
        </p>
      </div>

      {/* 화살표 */}
      <div className="px-2 text-gray-300 group-hover:text-primary transition-colors">
        <ChevronRight className="w-8 h-8" />
      </div>
    </div>
  );
}
