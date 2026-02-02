'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import React, { memo, useMemo } from 'react';
import SeekBar from '../SeekBar';
import { formatMs } from '@/utils';
import { usePlaybackProgress, usePlaybackRefs } from './PlaybackProvider';

type Props = {
  currentMusic: Music | null;
};

function NowPlayingProgressTickBase({ currentMusic }: Props) {
  const { positionMs, durationMs: rawDurationMs } = usePlaybackProgress();
  const { seekToMs } = usePlaybackRefs();

  const enabled = Boolean(currentMusic);

  const durationMs = useMemo(() => {
    if (!currentMusic) return 0;
    return rawDurationMs > 0 ? rawDurationMs : currentMusic.durationMs;
  }, [currentMusic, rawDurationMs]);

  const currentText = useMemo(() => formatMs(positionMs), [positionMs]);
  const durationText = useMemo(() => formatMs(durationMs), [durationMs]);

  return (
    <div className={`mb-3${enabled ? '' : ' opacity-50'}`}>
      <SeekBar positionMs={positionMs} durationMs={durationMs} disabled={!enabled || durationMs <= 0} onSeek={seekToMs} />
      <div className="flex justify-between text-[11px] font-bold text-gray-2 mt-2">
        <span>{enabled ? currentText : '0:00'}</span>
        <span>{enabled ? durationText : '0:00'}</span>
      </div>
    </div>
  );
}

export default memo(NowPlayingProgressTickBase);
