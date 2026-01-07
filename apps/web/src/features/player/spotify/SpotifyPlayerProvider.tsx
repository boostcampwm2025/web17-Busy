'use client';

import { useSpotifyPlayer } from './useSpotifyPlayer';
import { useSpotifySdk } from './useSpotifySdk';

export default function SpotifyPlayerProvider() {
  useSpotifySdk();
  useSpotifyPlayer();
  return null;
}
