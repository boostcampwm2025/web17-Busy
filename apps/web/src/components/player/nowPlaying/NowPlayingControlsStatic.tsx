'use client';

import React, { memo } from 'react';
import { Pause, Play, Shuffle, SkipBack, SkipForward } from 'lucide-react';
import VolumeControl from '../VolumeControl';

type Props = {
  enabled: boolean;

  isPlaying: boolean;
  canPrev: boolean;
  canNext: boolean;

  onClearPlayError: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onShuffle: () => void;

  volume: number;
  onVolumeChange: (v: number) => void;
};

function NowPlayingControlsStaticBase({
  enabled,
  isPlaying,
  canPrev,
  canNext,
  onClearPlayError,
  onTogglePlay,
  onPrev,
  onNext,
  onShuffle,
  volume,
  onVolumeChange,
}: Props) {
  return (
    <div className={`flex items-center justify-center gap-4${enabled ? '' : ' opacity-50'}`}>
      <button type="button" onClick={onShuffle} disabled title="랜덤 재생 버튼" className="text-gray-2 opacity-50 cursor-not-allowed">
        <Shuffle className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => {
          if (!enabled || !canPrev) return;
          onClearPlayError();
          onPrev();
        }}
        disabled={enabled && !canPrev}
        title={canPrev ? '이전 곡' : '이전 곡 없음'}
        className={enabled ? 'text-primary disabled:opacity-50 disabled:cursor-not-allowed' : 'text-gray-2 cursor-not-allowed'}
      >
        <SkipBack className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={() => {
          if (!enabled) return;
          onClearPlayError();
          onTogglePlay();
        }}
        disabled={!enabled}
        className={
          enabled
            ? 'w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-[3px_3px_0px_0px_#00ebc7]'
            : 'w-12 h-12 rounded-full bg-gray-2 text-white flex items-center justify-center cursor-not-allowed'
        }
        title={isPlaying ? '일시정지' : '재생'}
      >
        {enabled && isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
      </button>

      <button
        type="button"
        onClick={() => {
          if (!enabled || !canNext) return;
          onClearPlayError();
          onNext();
        }}
        disabled={enabled && !canNext}
        title={canNext ? '다음 곡' : '다음 곡 없음'}
        className={enabled ? 'text-primary disabled:opacity-50 disabled:cursor-not-allowed' : 'text-gray-2 cursor-not-allowed'}
      >
        <SkipForward className="w-6 h-6" />
      </button>

      <VolumeControl value={volume} onChange={onVolumeChange} disabled={!enabled} />
    </div>
  );
}

export default memo(NowPlayingControlsStaticBase);
