import React, { memo } from 'react';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useQueueNavigation } from '@/hooks/player/use-queue-navigation';
import { usePlayerStore } from '@/stores/usePlayerStore';
import VolumeControl from '../../VolumeControl';

function NowPlayingControlsStaticBase() {
  const isEnabled = usePlayerStore((s) => s.currentMusic !== null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const nav = useQueueNavigation();

  // 앞 곡의 재생 실패 배너가 다음 곡까지 남지 않게 한다
  const handleTogglePlay = () => {
    setPlayError(null);
    nav.togglePlay();
  };

  const handlePrev = () => {
    setPlayError(null);
    nav.playPrev();
  };

  const handleNext = () => {
    setPlayError(null);
    nav.playNext();
  };

  return (
    <div className={`relative flex items-center justify-center gap-4${isEnabled ? '' : ' opacity-50'}`}>
      {/* 오른쪽 VolumeControl이 자리로 잡아두는 폭과 같아야 재생 버튼이 가운데 온다 */}
      <div className="w-5 aspect-square" />

      <button
        type="button"
        onClick={handlePrev}
        disabled={!nav.canPrev}
        title={nav.canPrev ? '이전 곡' : '이전 곡 없음'}
        className="p-2 rounded-full text-primary transition-colors enabled:hover:bg-gray-4 disabled:text-gray-2 disabled:cursor-not-allowed"
      >
        <SkipBack className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={handleTogglePlay}
        disabled={!isEnabled}
        title={!isEnabled ? '재생할 음악이 없습니다' : isPlaying ? '일시정지' : '재생'}
        className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-white transition-all enabled:hover:shadow-[3px_3px_0px_0px_#00ebc7] disabled:bg-gray-2 disabled:cursor-not-allowed"
      >
        {isEnabled && isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
      </button>

      <button
        type="button"
        onClick={handleNext}
        disabled={!nav.canNext}
        title={nav.canNext ? '다음 곡' : '다음 곡 없음'}
        className="p-2 rounded-full text-primary transition-colors enabled:hover:bg-gray-4 disabled:text-gray-2 disabled:cursor-not-allowed"
      >
        <SkipForward className="w-6 h-6" />
      </button>

      <VolumeControl value={volume} onChange={setVolume} disabled={!isEnabled} />
    </div>
  );
}

export default memo(NowPlayingControlsStaticBase);
