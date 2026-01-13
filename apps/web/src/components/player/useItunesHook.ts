'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores';

export const useItunesHook = () => {
  // HTML5 Audio 객체 생성 (렌더링과 무관하게 유지)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // UI 동기화 및 음악 track URI 요청함수
  const currentMusic = usePlayerStore((state) => state.currentMusic);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playNext = usePlayerStore((state) => state.playNext);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  // Audio 객체 초기화
  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new Audio();
  }

  // 곡이 변경되었을 때: 소스 변경 및 재생
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentMusic) return;

    // 미리듣기 주소 설정
    audio.src = currentMusic.trackUri;
    audio.volume = 0.5; // 기본 볼륨

    // 재생 상태라면 바로 재생
    if (isPlaying) {
      audio.play().catch((e) => console.error('Playback failed:', e));
    }
  }, [currentMusic]);

  // Play/Pause 상태 동기화
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {
        // 자동 재생 정책 등으로 실패 시 UI도 멈춤 처리
        togglePlay();
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, togglePlay]);

  // 이벤트 리스너: 곡이 끝나면 다음 곡으로
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      playNext(); // 다음 곡 재생
    };

    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause(); // 컴포넌트 언마운트 시 정지
    };
  }, [playNext]);

  return null; // UI를 렌더링하지 않는 훅
};
