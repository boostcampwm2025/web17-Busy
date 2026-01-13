'use client';

import { Pause, Play, Shuffle, SkipBack, SkipForward, Repeat, PlusCircle, FolderPlus } from 'lucide-react';
import type { Music } from '@/types';
import { useMemo } from 'react';

interface NowPlayingProps {
  currentMusic: Music | null;
  isPlaying: boolean;

  canPrev: boolean;
  canNext: boolean;

  positionMs: number;
  durationMs: number;

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
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const calcProgressPercent = (positionMs: number, durationMs: number): number => {
  if (durationMs <= 0) return 0;
  const raw = (positionMs / durationMs) * 100;
  return Math.min(100, Math.max(0, raw));
};

export default function NowPlaying({
  currentMusic,
  isPlaying,
  canPrev,
  canNext,
  positionMs,
  durationMs,
  onTogglePlay,
  onPrev,
  onNext,
  onShuffle,
  onRepeat,
  onPost,
  onSave,
}: NowPlayingProps) {
  const isPlayable = Boolean(currentMusic);

  const shownDurationMs = useMemo(() => {
    if (!currentMusic) return 0;
    return durationMs > 0 ? durationMs : currentMusic.durationMs;
  }, [currentMusic, durationMs]);

  const progressPercent = useMemo(() => calcProgressPercent(positionMs, shownDurationMs), [positionMs, shownDurationMs]);
  const currentText = useMemo(() => formatMs(positionMs), [positionMs]);
  const durationText = useMemo(() => formatMs(shownDurationMs), [shownDurationMs]);

  const handleTogglePlayClick = () => {
    if (!isPlayable) return;
    onTogglePlay();
  };

  const handlePrevClick = () => {
    if (!canPrev) return;
    onPrev();
  };

  const handleNextClick = () => {
    if (!canNext) return;
    onNext();
  };

  const handleShuffleClick = () => onShuffle();
  const handleRepeatClick = () => onRepeat();

  const handlePostClick = () => onPost();
  const handleSaveClick = () => onSave();

  if (!currentMusic) {
    return (
      <div className="p-4 border-b-2 border-primary">
        <h2 className="text-xs font-bold text-accent-pink tracking-widest uppercase mb-2 text-center">Now Playing</h2>

        <div className="mx-auto w-full max-w-55 aspect-square rounded-2xl border-2 border-primary overflow-hidden bg-gray-4 mb-2 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-2">No Music</span>
        </div>

        <div className="text-center mb-3">
          <p className="font-bold text-gray-1">재생 중인 음악이 없습니다.</p>
          <p className="text-sm text-gray-2 mt-1">피드/검색에서 음악을 선택해보세요.</p>
        </div>

        <div className="mb-3 opacity-50">
          <div className="w-full bg-gray-3 h-2 rounded-full overflow-hidden border border-primary">
            <div className="h-full bg-accent-cyan rounded-full" style={{ width: '0%' }} />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-gray-2 mt-2">
            <span>0:00</span>
            <span>0:00</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 opacity-50">
          <button type="button" disabled className="text-gray-2 cursor-not-allowed">
            <Shuffle className="w-5 h-5" />
          </button>
          <button type="button" disabled className="text-gray-2 cursor-not-allowed">
            <SkipBack className="w-6 h-6" />
          </button>
          <button type="button" disabled className="w-12 h-12 rounded-full bg-gray-2 text-white flex items-center justify-center cursor-not-allowed">
            <Play className="w-6 h-6 ml-0.5" />
          </button>
          <button type="button" disabled className="text-gray-2 cursor-not-allowed">
            <SkipForward className="w-6 h-6" />
          </button>
          <button type="button" disabled className="text-gray-2 cursor-not-allowed">
            <Repeat className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b-2 border-primary">
      <h2 className="text-xs font-bold text-accent-pink tracking-widest uppercase mb-2 text-center">Now Playing</h2>

      {/* 가운데 검은 원 제거 + 크기 축소 */}
      <div className="mx-auto w-full max-w-55 aspect-square rounded-2xl border-2 border-primary overflow-hidden bg-gray-4 mb-2">
        <img src={currentMusic.albumCoverUrl} alt={currentMusic.title} className="w-full h-full object-cover" />
      </div>

      <div className="text-center mb-2">
        <h3 className="text-lg font-black text-primary truncate">{currentMusic.title}</h3>
        <p className="text-xs font-bold text-gray-1 truncate">{currentMusic.artistName}</p>
      </div>

      {/* Quick Actions: disabled 유지 */}
      <div className="flex items-center justify-center gap-2 mb-3">
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

      {/* 실제 progress/time 연동 */}
      <div className="mb-3">
        <div className="w-full bg-gray-3 h-2 rounded-full overflow-hidden border border-primary">
          <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between text-[11px] font-bold text-gray-2 mt-2">
          <span>{currentText}</span>
          <span>{durationText}</span>
        </div>
      </div>

      {/* 재생 버튼 크기 축소 */}
      <div className="flex items-center justify-center gap-4">
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
          <SkipBack className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={handleTogglePlayClick}
          className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-[3px_3px_0px_0px_#00ebc7]"
          title={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={handleNextClick}
          disabled={!canNext}
          title={canNext ? '다음 곡' : '다음 곡 없음'}
          className="text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipForward className="w-6 h-6" />
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
