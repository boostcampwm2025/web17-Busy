'use client';

import { memo } from 'react';
import type { MusicResponseDto as Music } from '@repo/dto';
import { TrackItem } from './index';
import { ContentSearchMode } from '@/types';

type Props = {
  mode: ContentSearchMode;
  items: Music[];
  isAuthenticated: boolean;
};

function MusicSearchResults({ mode, items, isAuthenticated }: Props) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <TrackItem key={`${mode}-${item.id}`} mode={mode} item={item} isAuthenticated={isAuthenticated} />
      ))}
    </div>
  );
}

export default memo(MusicSearchResults);
