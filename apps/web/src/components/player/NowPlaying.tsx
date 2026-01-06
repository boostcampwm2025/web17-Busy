'use client';

import type { Music } from '@/types';
import { Pause, Play, PlusCircle, FolderPlus } from 'lucide-react';

interface NowPlayingProps {
  currentMusic: Music | null;
  isPlaying: boolean;
  onTogglePlay: () => void;

  /** 이번 이슈에서는 비활성/빈 핸들러 */
  onPost: () => void;
  onSave: () => void;
}

const DISABLED_ACTION_TITLE = '추후 연결 예정';

export default function NowPlaying({ currentMusic, isPlaying, onTogglePlay, onPost, onSave }: NowPlayingProps) {
  const isPlayable = Boolean(currentMusic);

  const handleTogglePlayClick = () => {
    if (!isPlayable) {
      return;
    }
    onTogglePlay();
  };

  const handlePostClick = () => {
    onPost();
  };

  const handleSaveClick = () => {
    onSave();
  };

  if (!currentMusic) {
    return (
      <div className="p-6 border-b-2 border-primary">
        <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Now Playing</h2>
        <div className="flex flex-col items-center justify-center text-center gap-2 py-10">
          <p className="font-bold text-gray-1">재생 중인 음악이 없습니다.</p>
          <p className="text-sm text-gray-2">피드/검색에서 음악을 선택해보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border-b-2 border-primary">
      <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 text-center">Now Playing</h2>

      <div className="w-full aspect-square rounded-2xl border-2 border-primary overflow-hidden mb-4">
        <img src={currentMusic.albumCoverUrl} alt={currentMusic.title} className="w-full h-full object-cover" />
      </div>

      <div className="text-center mb-4">
        <h3 className="text-lg font-black text-primary truncate">{currentMusic.title}</h3>
        <p className="text-sm font-bold text-gray-1 truncate">{currentMusic.artistName}</p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-5">
        <button
          type="button"
          onClick={handlePostClick}
          disabled
          title={DISABLED_ACTION_TITLE}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-primary text-primary font-bold text-xs opacity-50 cursor-not-allowed"
        >
          <PlusCircle className="w-4 h-4" />
          게시
        </button>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled
          title={DISABLED_ACTION_TITLE}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-primary text-primary font-bold text-xs opacity-50 cursor-not-allowed"
        >
          <FolderPlus className="w-4 h-4" />
          저장
        </button>
      </div>

      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={handleTogglePlayClick}
          className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center hover:bg-accent-pink transition-colors"
          title={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
        </button>
      </div>
    </div>
  );
}
