'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import React, { memo } from 'react';
import { DEFAULT_IMAGES } from '@/constants';
import { usePlaybackRefs } from './PlaybackProvider';

type Props = {
  currentMusic: Music | null;
  isYouTube: boolean;
};

function NowPlayingCoverPlaybackBase({ currentMusic, isYouTube }: Props) {
  const { containerRef } = usePlaybackRefs();

  return (
    <div className="mx-auto w-full max-w-55 aspect-square rounded-2xl border-2 border-primary overflow-hidden bg-gray-4 mb-2 flex items-center justify-center">
      <div className={`w-full h-full ${isYouTube ? '' : 'hidden'}`}>
        <div ref={isYouTube ? (containerRef ?? undefined) : undefined} className="w-full h-full" />
      </div>

      <img
        src={currentMusic?.albumCoverUrl || DEFAULT_IMAGES.ALBUM}
        alt={currentMusic?.title ?? '현재 재생 음악 없음'}
        className={`w-full h-full object-cover ${!currentMusic || isYouTube ? 'hidden' : ''}`}
      />

      {!currentMusic && <span className="text-sm font-bold text-gray-2">No Music</span>}
    </div>
  );
}

export default memo(NowPlayingCoverPlaybackBase);
