'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import { Pause, Play, Shuffle, SkipBack, SkipForward, PlusCircle, FolderPlus } from 'lucide-react';
import { useMemo } from 'react';
import { usePlayerStore } from '@/stores';
import { VolumeControl, SeekBar } from './index';

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

  onSeek: (ms: number) => void;
}

const DISABLED_ACTION_TITLE = '추후 연결 예정';

const formatMs = (ms: number): string => {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function NowPlaying(props: NowPlayingProps) {
  const { currentMusic, isPlaying, canPrev, canNext, positionMs, durationMs, onTogglePlay, onPrev, onNext, onShuffle, onRepeat, onPost, onSave } =
    props;

  const isPlayable = Boolean(currentMusic);

  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const playError = usePlayerStore((s) => s.playError);
  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const shownDurationMs = useMemo(() => {
    if (!currentMusic) return 0;
    return durationMs > 0 ? durationMs : currentMusic.durationMs;
  }, [currentMusic, durationMs]);

  const currentText = useMemo(() => formatMs(positionMs), [positionMs]);
  const durationText = useMemo(() => formatMs(shownDurationMs), [shownDurationMs]);

  const handleTogglePlayClick = () => {
    if (!isPlayable) return;
    setPlayError(null);
    onTogglePlay();
  };

  const handlePrevClick = () => {
    if (!canPrev) return;
    setPlayError(null);
    onPrev();
  };

  const handleNextClick = () => {
    if (!canNext) return;
    setPlayError(null);
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
          <SeekBar positionMs={positionMs} durationMs={shownDurationMs} disabled={!currentMusic || shownDurationMs <= 0} onSeek={props.onSeek} />
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
          <VolumeControl value={volume} onChange={setVolume} disabled={!currentMusic} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b-2 border-primary">
      <h2 className="text-xs font-bold text-accent-pink tracking-widest uppercase mb-2 text-center">Now Playing</h2>

      <div className="mx-auto w-full max-w-55 aspect-square rounded-2xl border-2 border-primary overflow-hidden bg-gray-4 mb-2">
        <img src={currentMusic.albumCoverUrl} alt={currentMusic.title} className="w-full h-full object-cover" />
      </div>

      <div className="text-center mb-2">
        <h3 className="text-lg font-black text-primary truncate">{currentMusic.title}</h3>
        <p className="text-xs font-bold text-gray-1 truncate">{currentMusic.artistName}</p>
      </div>

      {/* 재생 실패 메시지(토스트 대신 인라인) */}
      {playError ? (
        <div className="mb-3 rounded-xl border-2 border-secondary bg-secondary/10 px-3 py-2 text-sm font-bold text-secondary">{playError}</div>
      ) : null}

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

      <div className="mb-3">
        {/* 진행바 + seek */}
        <SeekBar positionMs={positionMs} durationMs={shownDurationMs} disabled={!currentMusic || shownDurationMs <= 0} onSeek={props.onSeek} />
        <div className="flex justify-between text-[11px] font-bold text-gray-2 mt-2">
          <span>{currentText}</span>
          <span>{durationText}</span>
        </div>
      </div>

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
        <VolumeControl value={volume} onChange={setVolume} disabled={!currentMusic} />
      </div>
    </div>
  );
}
