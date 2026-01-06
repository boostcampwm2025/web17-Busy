'use client';

import { FolderPlus, Pause, Play, PlusCircle, SkipBack, SkipForward } from 'lucide-react';
import type { Music } from '@/types';

interface MiniPlayerBarProps {
  currentMusic: Music | null;
  isPlaying: boolean;

  onTogglePlay: () => void;

  /** 이번 이슈에서는 비활성/빈 핸들러 */
  onPrev: () => void;
  onNext: () => void;
  onPost: () => void;
  onSave: () => void;
}

const DISABLED_ACTION_TITLE = '추후 연결 예정';

export default function MiniPlayerBar({ currentMusic, isPlaying, onTogglePlay, onPrev, onNext, onPost, onSave }: MiniPlayerBarProps) {
  const isPlayable = Boolean(currentMusic);

  const handleTogglePlayClick = () => {
    if (!isPlayable) {
      return;
    }
    onTogglePlay();
  };

  const handlePrevClick = () => {
    onPrev();
  };

  const handleNextClick = () => {
    onNext();
  };

  const handlePostClick = () => {
    onPost();
  };

  const handleSaveClick = () => {
    onSave();
  };

  return (
    <section className="flex lg:hidden h-full items-center gap-3 px-4 bg-white">
      <div className="w-12 h-12 rounded border border-gray-3 overflow-hidden bg-gray-4 shrink-0">
        {currentMusic ? <img src={currentMusic.albumCoverUrl} alt={currentMusic.title} className="w-full h-full object-cover" /> : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-primary truncate">{currentMusic ? currentMusic.title : '재생 중인 음악 없음'}</p>
        <p className="text-xs font-bold text-gray-1 truncate">{currentMusic ? currentMusic.artistName : ' '}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrevClick}
          disabled
          title={DISABLED_ACTION_TITLE}
          className="p-2 text-gray-2 opacity-50 cursor-not-allowed"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleTogglePlayClick}
          disabled={!isPlayable}
          title={!isPlayable ? '재생할 음악이 없습니다' : isPlaying ? '일시정지' : '재생'}
          className="p-2 rounded-full bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={handleNextClick}
          disabled
          title={DISABLED_ACTION_TITLE}
          className="p-2 text-gray-2 opacity-50 cursor-not-allowed"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handlePostClick}
          disabled
          title={DISABLED_ACTION_TITLE}
          className="p-2 text-gray-2 opacity-50 cursor-not-allowed"
        >
          <PlusCircle className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled
          title={DISABLED_ACTION_TITLE}
          className="p-2 text-gray-2 opacity-50 cursor-not-allowed"
        >
          <FolderPlus className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
