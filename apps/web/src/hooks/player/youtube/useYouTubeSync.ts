'use client';

import { DEFAULT_VOLUME } from '@/constants';
import { usePlayerStore } from '@/stores';
import { PlayerProgress } from '@/types';
import { clamp01 } from '@/utils';
import { MusicProvider } from '@repo/dto/values';
import { useEffect } from 'react';

type Props = {
  ready: boolean;
  playerRef: React.RefObject<YT.Player | null>;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
};

export function useYouTubeSync({ ready, playerRef, setProgress }: Props) {
  const volume = usePlayerStore((s) => s.volume);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const videoId = currentMusic?.trackUri;
  const isYoutube = currentMusic?.provider === MusicProvider.YOUTUBE;

  // volume 동기화
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const v01 = Number.isFinite(volume) ? clamp01(volume) : DEFAULT_VOLUME;
    const v100 = Math.round(v01 * 100);

    if (v100 <= 0) {
      player.mute();
      player.setVolume(0);
    } else {
      if (player.isMuted()) player.unMute();
      player.setVolume(v100);
    }
  }, [volume]);

  // video 교체
  useEffect(() => {
    if (!ready) return;

    const player = playerRef.current;
    if (!player) return;

    if (!currentMusic || !isYoutube) {
      player.stopVideo();
      setProgress({ positionMs: 0, durationMs: 0 });
      return;
    }

    if (!videoId) {
      player.stopVideo();
      setProgress({ positionMs: 0, durationMs: 0 });
      // youtube play error로 분리 후 사용
      // setPlayError('재생할 수 있는 YouTube videoId가 없습니다.');
      return;
    }

    setProgress({ durationMs: 0, positionMs: 0 });

    // isPlaying에 따른 분기 필요? itunes는 분기 안 함
    if (isPlaying) player.loadVideoById(videoId);
    else player.cueVideoById(videoId);
  }, [ready, currentMusic?.id, videoId, isYoutube, isPlaying]);

  // 에러메시지 초기화
  useEffect(() => {
    setPlayError(null);
  }, [currentMusic?.id, setPlayError]);

  // 재생/일시정지 제어
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !currentMusic || !isYoutube) return;

    if (isPlaying) player.playVideo();
    else player.pauseVideo();
  }, [isYoutube, isPlaying, currentMusic?.id]);
}
