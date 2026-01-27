'use client';

import { useState } from 'react';
import { PlayerProgress } from '@/types';
import { YOUTUBE_PLAYER_TICK_INTERVAL_MS } from '@/constants';
import { usePlayerTick, useYouTubePlayer, useYouTubeProgress, useYouTubeSync } from './youtube';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function useYouTubeHook() {
  const [progress, setProgress] = useState<PlayerProgress>({ positionMs: 0, durationMs: 0 });
  const [isTicking, setIsTicking] = useState(false);

  /**
   * 플레이어 인스턴스 생성
   * 생성 시 이벤트 핸들러 등록
   */
  const { containerRef, playerRef, ready } = useYouTubePlayer({ setProgress, setIsTicking });

  /**
   * progress 관련 함수 정의
   * getTimeSec: 현재 재생위치 반환 함수
   * onTickMs: setProgress로 positionMs 설정
   * seekToMs: player의 재생 시점 조정 함수 (SeekBar onClick 함수)
   */
  const { getTimeSec, onTickMs, seekToMs } = useYouTubeProgress({ progress, playerRef, setProgress });

  /**
   * volume 동기화
   * video 교체
   * 에러메시지 초기화
   * 재생/일시정지 제어
   */
  useYouTubeSync({ ready, playerRef, setProgress });

  /**
   * YOUTUBE_PLAYER_TICK_INTERVAL_MS 마다 player의 재생 위치와 progress 동기화
   */
  usePlayerTick(isTicking, getTimeSec, onTickMs, YOUTUBE_PLAYER_TICK_INTERVAL_MS);

  return {
    containerRef,
    ...progress,
    seekToMs,
  };
}
