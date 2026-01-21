'use client';

import { Library } from 'lucide-react';
import type { PlaylistBrief } from '@/hooks/playlist/usePlaylistRecommendations';

type Props = {
  brief: PlaylistBrief;
  isLoading: boolean;
  onSelect: (playlistId: string) => void;
};

export const PlaylistBriefItem = ({ brief, isLoading, onSelect }: Props) => {
  const coverUrl = brief.firstAlbumCoverUrl;

  return (
    <button
      type="button"
      onClick={() => onSelect(brief.id)}
      disabled={isLoading}
      className="w-full flex items-center px-4 py-3 hover:bg-gray-4 transition-colors text-left group disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <div className="relative mr-4">
        <div className="absolute top-1 -right-1 w-10 h-10 bg-gray-2 border border-gray-3 rounded-lg rotate-6" />
        <div className="absolute top-0.5 -right-0.5 w-10 h-10 bg-gray-3 border border-gray-3 rounded-lg rotate-3" />

        {coverUrl ? (
          <img src={coverUrl} alt="playlist-cover" className="relative w-10 h-10 rounded-lg border border-gray-3 object-cover z-10" />
        ) : (
          <div className="relative w-10 h-10 rounded-lg border border-gray-3 bg-white z-10 flex items-center justify-center">
            <Library className="w-4 h-4 text-gray-1" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-primary truncate group-hover:text-accent-cyan transition-colors">{brief.title}</p>
        <div className="flex items-center text-xs text-gray-1 mt-0.5">
          <Library className="w-3 h-3 mr-1" />
          <span>{brief.tracksCount}곡</span>
        </div>
      </div>

      <div className="text-xs font-bold text-gray-2 px-2 py-1 border border-gray-3 rounded group-hover:bg-white group-hover:text-primary group-hover:border-primary transition-colors">
        {isLoading ? '불러오는 중' : '선택'}
      </div>
    </button>
  );
};
