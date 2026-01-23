'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import { TrackItem } from './index';

type Props = {
  musics: Music[];
  meId: string | null;
  isAuthenticated: boolean;
};

export default function MusicSearchResults({ musics, meId, isAuthenticated }: Props) {
  return (
    <div className="space-y-1">
      {musics.map((music) => (
        <TrackItem key={music.id} music={music} meId={meId} isAuthenticated={isAuthenticated} />
      ))}
    </div>
  );
}
