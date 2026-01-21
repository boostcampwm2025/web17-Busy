'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import { TrackItem } from './index';

type Props = {
  musics: Music[];
  onPlay: (music: Music) => void;
};

export default function MusicSearchResults({ musics, onPlay }: Props) {
  return (
    <div className="space-y-1">
      {musics.map((music) => (
        <TrackItem key={music.id} music={music} disabledActions onPlay={onPlay} />
      ))}
    </div>
  );
}
