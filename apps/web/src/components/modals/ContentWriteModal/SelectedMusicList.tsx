import React from 'react';
import { ChevronUp, ChevronDown, Trash2, Music as MusicIcon } from 'lucide-react';
import { Music } from '@/types';

interface SelectedMusicListProps {
  Musics: Music[];
  onRemove: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}

export const SelectedMusicList = ({ Musics, onRemove, onMove }: SelectedMusicListProps) => {
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <label className="text-sm font-bold text-gray-1 mb-2 block">
        선택된 음악 <span className="text-accent-cyan">*</span> ({Musics.length})
      </label>

      <div className="flex-1 border-2 border-primary/20 rounded-xl overflow-y-auto max-h-37.5 p-2 bg-gray-4/50 custom-scrollbar space-y-2 min-h-37.5">
        {Musics.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-2">
            <MusicIcon className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm font-medium">검색 또는 내 보관함에서 추가해주세요</span>
          </div>
        ) : (
          Musics.map((Music, idx) => (
            <div key={Music.musicId} className="flex items-center bg-white p-2 rounded-lg border border-primary/10 shadow-sm">
              <img src={Music.albumCoverUrl} alt="art" className="w-10 h-10 rounded border border-gray-3 object-cover shrink-0" />

              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-primary">{Music.title}</p>
                <p className="text-xs text-gray-1 truncate">{Music.artistName}</p>
              </div>

              {/* 컨트롤 버튼 그룹 */}
              <div className="flex items-center ml-2 space-x-1">
                <div className="flex flex-col">
                  <button
                    onClick={() => onMove(idx, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 text-gray-1 hover:text-accent-cyan disabled:opacity-30 disabled:hover:text-gray-1 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onMove(idx, 'down')}
                    disabled={idx === Musics.length - 1}
                    className="p-0.5 text-gray-1 hover:text-accent-cyan disabled:opacity-30 disabled:hover:text-gray-1 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => onRemove(Music.musicId)}
                  className="p-1.5 text-gray-2 hover:text-accent-pink rounded-full hover:bg-gray-4 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
