'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '@/stores';

type PlayerProgress = {
  positionMs: number;
  durationMs: number;
};

const DEFAULT_VOLUME = 0.5;

export const useItunesHook = (): PlayerProgress => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playNext = usePlayerStore((s) => s.playNext);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const queueLength = usePlayerStore((s) => s.queue.length);

  const [progress, setProgress] = useState<PlayerProgress>({ positionMs: 0, durationMs: 0 });

  // Audio 객체는 effect에서 1회 생성
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.volume = DEFAULT_VOLUME;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // 1곡이면 loop=true로 안정적으로 반복
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = queueLength <= 1;
  }, [queueLength]);

  // currentMusic 변경 시 소스 변경 + 초기 progress 리셋
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentMusic) {
      audio.pause();
      audio.src = '';
      setProgress({ positionMs: 0, durationMs: 0 });
      return;
    }

    audio.src = currentMusic.trackUri;
    audio.load(); // 브라우저별 ended -> 재생 안정성 개선
    setProgress({ positionMs: 0, durationMs: currentMusic.durationMs ?? 0 });

    if (!isPlaying) return;

    void audio.play().catch(() => {
      togglePlay();
    });
  }, [currentMusic, isPlaying, togglePlay]);

  // play/pause 동기화
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      void audio.play().catch(() => {
        togglePlay();
      });
      return;
    }

    audio.pause();
  }, [isPlaying, togglePlay]);

  // timeupdate/loadedmetadata/ended 이벤트로 progress 동기화
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress((prev) => ({ ...prev, positionMs: Math.floor(audio.currentTime * 1000) }));
    };

    const handleLoadedMetadata = () => {
      const durationMs = Number.isFinite(audio.duration) ? Math.floor(audio.duration * 1000) : 0;
      setProgress((prev) => ({ ...prev, durationMs: durationMs || prev.durationMs }));
    };

    const handleEnded = () => {
      // 1곡이면 loop가 처리하므로 아무 것도 하지 않음
      if (queueLength <= 1) return;
      playNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playNext, queueLength]); // queueLength deps 추가

  return progress;
};
