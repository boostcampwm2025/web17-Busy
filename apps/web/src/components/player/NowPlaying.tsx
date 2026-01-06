'use client';

import { Pause, Play, Shuffle, SkipBack, SkipForward, Repeat, PlusCircle, FolderPlus } from 'lucide-react';
import type { Music } from '@/types';
import { useMemo, useState } from 'react';

interface NowPlayingProps {
  currentMusic: Music | null;
  isPlaying: boolean;

  canPrev: boolean;
  canNext: boolean;

  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;

  onShuffle: () => void;
  onRepeat: () => void;

  onPost: () => void;
  onSave: () => void;
}

const DISABLED_ACTION_TITLE = '추후 연결 예정';

const formatMs = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function NowPlaying({
  currentMusic,
  isPlaying,
  canPrev,
  canNext,
  onTogglePlay,
  onPrev,
  onNext,
  onShuffle,
  onRepeat,
  onPost,
  onSave,
}: NowPlayingProps) {
  // NOTE(dev): 실제 재생 엔진 연동 전이라 진행도는 더미
  const [progressPercent] = useState(30);

  const isPlayable = Boolean(currentMusic);
  const durationText = useMemo(() => (currentMusic ? formatMs(currentMusic.durationMs) : '0:00'), [currentMusic]);
  const currentText = useMemo(() => {
    if (!currentMusic) {
      return '0:00';
    }
    const currentMs = Math.floor((currentMusic.durationMs * progressPercent) / 100);
    return formatMs(currentMs);
  }, [currentMusic, progressPercent]);

  const handleTogglePlayClick = () => {
    if (!isPlayable) {
      return;
    }
    onTogglePlay();
  };

  const handlePrevClick = () => {
    if (!canPrev) {
      return;
    }
    onPrev();
  };

  const handleNextClick = () => {
    if (!canNext) {
      return;
    }
    onNext();
  };

  const handleShuffleClick = () => {
    onShuffle();
  };

  const handleRepeatClick = () => {
    onRepeat();
  };

  const handlePostClick = () => onPost();
  const handleSaveClick = () => onSave();

  if (!currentMusic) {
    return (
      <div className="p-5 border-b-2 border-primary">
        <h2 className="text-xs font-bold text-accent-pink tracking-widest uppercase mb-3 text-center">Now Playing</h2>
        <div className="py-8 text-center">
          <p className="font-bold text-gray-1">재생 중인 음악이 없습니다.</p>
          <p className="text-sm text-gray-2 mt-1">피드/검색에서 음악을 선택해보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 border-b-2 border-primary">
      <h2 className="text-xs font-bold text-accent-pink tracking-widest uppercase mb-3 text-center">Now Playing</h2>

      {/* 정사각 커버 (너무 커지지 않게 max-width 제한) */}
      <div className="mx-auto w-full max-w-65 aspect-square rounded-2xl border-2 border-primary overflow-hidden bg-gray-4 mb-3 relative">
        <img src={currentMusic.albumCoverUrl} alt={currentMusic.title} className="w-full h-full object-cover" />
        <div className="absolute left-1/2 top-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full border-2 border-white" />
      </div>

      <div className="text-center mb-3">
        <h3 className="text-xl font-black text-primary truncate">{currentMusic.title}</h3>
        <p className="text-xs font-bold text-gray-1 truncate">{currentMusic.artistName}</p>
      </div>

      {/* Quick Actions: 이번 이슈에서는 disabled */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          type="button"
          onClick={handlePostClick}
          disabled
          title={DISABLED_ACTION_TITLE}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-white font-bold text-xs opacity-50 cursor-not-allowed"
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

      {/* Progress */}
      <div className="mb-4">
        <div className="w-full bg-gray-3 h-2 rounded-full overflow-hidden border border-primary">
          <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between text-[11px] font-bold text-gray-2 mt-2">
          <span>{currentText}</span>
          <span>{durationText}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={handleShuffleClick}
          disabled
          title={DISABLED_ACTION_TITLE}
          className="text-gray-2 opacity-50 cursor-not-allowed"
        >
          <Shuffle className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handlePrevClick}
          disabled={!canPrev}
          title={canPrev ? '이전 곡' : '이전 곡 없음'}
          className="text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipBack className="w-7 h-7" />
        </button>

        <button
          type="button"
          onClick={handleTogglePlayClick}
          className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-[4px_4px_0px_0px_#00ebc7]"
          title={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={handleNextClick}
          disabled={!canNext}
          title={canNext ? '다음 곡' : '다음 곡 없음'}
          className="text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipForward className="w-7 h-7" />
        </button>

        <button
          type="button"
          onClick={handleRepeatClick}
          disabled
          title={DISABLED_ACTION_TITLE}
          className="text-gray-2 opacity-50 cursor-not-allowed"
        >
          <Repeat className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
