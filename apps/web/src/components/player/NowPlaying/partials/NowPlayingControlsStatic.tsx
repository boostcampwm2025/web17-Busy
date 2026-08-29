import React, { memo } from 'react';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import VolumeControl from '../../VolumeControl';

type Props = {
  isEnabled: boolean;

  isPlaying: boolean;
  canPrev: boolean;
  canNext: boolean;

  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;

  volume: number;
  onVolumeChange: (v: number) => void;
};

function NowPlayingControlsStaticBase({ isEnabled, isPlaying, canPrev, canNext, onTogglePlay, onPrev, onNext, volume, onVolumeChange }: Props) {
  return (
    <div className={`relative flex items-center justify-center gap-4${isEnabled ? '' : ' opacity-50'}`}>
      <div className="w-5 aspect-square" />

      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        title={canPrev ? '이전 곡' : '이전 곡 없음'}
        className="p-2 rounded-full text-primary transition-colors enabled:hover:bg-gray-4 disabled:text-gray-2 disabled:cursor-not-allowed"
      >
        <SkipBack className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={onTogglePlay}
        disabled={!isEnabled}
        title={!isEnabled ? '재생할 음악이 없습니다' : isPlaying ? '일시정지' : '재생'}
        className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-white transition-all enabled:hover:shadow-[3px_3px_0px_0px_#00ebc7] disabled:bg-gray-2 disabled:cursor-not-allowed"
      >
        {isEnabled && isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        title={canNext ? '다음 곡' : '다음 곡 없음'}
        className="p-2 rounded-full text-primary transition-colors enabled:hover:bg-gray-4 disabled:text-gray-2 disabled:cursor-not-allowed"
      >
        <SkipForward className="w-6 h-6" />
      </button>

      <VolumeControl value={volume} onChange={onVolumeChange} disabled={!isEnabled} />
    </div>
  );
}

export default memo(NowPlayingControlsStaticBase);
