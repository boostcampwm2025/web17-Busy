import type { MusicResponseDto as Music } from '@repo/dto';
import React, { memo, useMemo } from 'react';
import SeekBar from '../../SeekBar';
import { formatMs } from '@/utils/time';
import { usePlaybackProgress, usePlaybackRefs } from './PlaybackProvider';

type Props = {
  currentMusic: Music | null;
};

function NowPlayingProgressTickBase({ currentMusic }: Props) {
  const { positionMs, durationMs: rawDurationMs } = usePlaybackProgress();
  const { seekToMs } = usePlaybackRefs();

  const isEnabled = Boolean(currentMusic);

  const durationMs = useMemo(() => {
    if (!currentMusic) return 0;
    return rawDurationMs > 0 ? rawDurationMs : currentMusic.durationMs;
  }, [currentMusic, rawDurationMs]);

  const currentText = useMemo(() => formatMs(positionMs), [positionMs]);
  const durationText = useMemo(() => formatMs(durationMs), [durationMs]);

  return (
    <div className={`mb-3${isEnabled ? '' : ' opacity-50'}`}>
      <SeekBar positionMs={positionMs} durationMs={durationMs} disabled={!isEnabled || durationMs <= 0} onSeek={seekToMs} />
      <div className="flex justify-between text-[11px] font-bold text-gray-2 mt-2">
        <span>{isEnabled ? currentText : '0:00'}</span>
        <span>{isEnabled ? durationText : '0:00'}</span>
      </div>
    </div>
  );
}

export default memo(NowPlayingProgressTickBase);
