'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import { TrackItem } from './index';

type Props = {
  musics: Music[];
  isAuthenticated: boolean;
};

export default function MusicSearchResults({ musics, isAuthenticated }: Props) {
  return (
    <div className="space-y-1">
      {musics.map((music) => (
        <TrackItem key={music.id} music={music} isAuthenticated={isAuthenticated} />
      ))}
    </div>
  );
}
