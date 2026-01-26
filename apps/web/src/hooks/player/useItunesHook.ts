'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '@/stores';
import { Playback, PlayerProgress } from './types';
import { clamp01, clampMs } from './utils';
import { DEFAULT_VOLUME } from './constants';

const toPlaybackErrorMessage = (e: unknown): string => {
  if (e instanceof DOMException) {
    if (e.name === 'NotAllowedError') return '재생을 시작하려면 화면을 한 번 터치/클릭해주세요.';
    if (e.name === 'NotSupportedError') return '이 오디오는 재생을 지원하지 않습니다.';
  }
  return '재생에 실패했습니다. 잠시 후 다시 시도해주세요.';
};

export const useItunesHook = (): Playback => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const queueLength = usePlayerStore((s) => s.queue.length);
  const playNext = usePlayerStore((s) => s.playNext);

  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const volume = usePlayerStore((s) => s.volume);

  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const [progress, setProgress] = useState<PlayerProgress>({ positionMs: 0, durationMs: 0 });

  // Audio 객체는 effect에서 1회 생성
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.volume = Number.isFinite(volume) ? clamp01(volume) : DEFAULT_VOLUME;

    audioRef.current = audio;
    setVolume(audio.volume); // store 기본값 동기화

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []); // 1회만

  // volume 동기화 (UI에서 바꿀 때 반영)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const v = Number.isFinite(volume) ? clamp01(volume) : DEFAULT_VOLUME;
    audio.volume = v;
  }, [volume]);

  // 1곡이면 loop=true로 안정적으로 반복
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = queueLength <= 1;
  }, [queueLength]);

  // 소스 교체: currentMusic 변경 시에만 실행 (pause 토글로 재실행되면 안 됨)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 재생 실패 메시지는 트랙 변경 시 초기화
    setPlayError(null);

    if (!currentMusic) {
      audio.pause();
      audio.src = '';
      setProgress({ positionMs: 0, durationMs: 0 });
      return;
    }

    const nextSrc = currentMusic.trackUri ?? '';
    if (!nextSrc) {
      audio.pause();
      audio.src = '';
      setProgress({ positionMs: 0, durationMs: 0 });
      setPlayError('재생할 수 있는 미리듣기 URL이 없습니다.');
      return;
    }

    // 트랙 변경 시에만 0으로 리셋
    audio.pause();
    audio.currentTime = 0;
    audio.src = nextSrc;
    audio.load();

    setProgress({ positionMs: 0, durationMs: currentMusic.durationMs ?? 0 });
  }, [currentMusic, setPlayError]);

  // 재생/일시정지 제어: 여기서만 play/pause 수행
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentMusic) return;

    if (!isPlaying) {
      audio.pause();
      return;
    }

    void audio.play().catch((e) => {
      setPlayError(toPlaybackErrorMessage(e));
      togglePlay();
    });
  }, [isPlaying, currentMusic?.id, currentMusic, togglePlay, setPlayError]);

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
  }, [playNext, queueLength]);

  // Seek API (UI에서 클릭/드래그로 호출)
  const seekToMs = useCallback(
    (ms: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      // duration 우선순위: audio.duration -> progress.durationMs
      const metaMs = Number.isFinite(audio.duration) ? Math.floor(audio.duration * 1000) : 0;
      const maxMs = metaMs > 0 ? metaMs : progress.durationMs;

      if (maxMs <= 0) return;

      const nextMs = clampMs(ms, maxMs);
      audio.currentTime = nextMs / 1000;

      // 즉시 UI 반영 (timeupdate 기다리지 않음)
      setProgress((prev) => ({ ...prev, positionMs: nextMs, durationMs: maxMs || prev.durationMs }));
    },
    [progress.durationMs],
  );

  return { ...progress, seekToMs };
};
