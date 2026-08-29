import { useState } from 'react';

import { Playback, PlayerProgress } from '@/types/player';
import { useItunesElement } from './itunes/use-itunes-element';
import { useItunesProgress } from './itunes/use-itunes-progress';
import { useItunesSync } from './itunes/use-itunes-sync';

export const useItunesPlayback = (): Playback => {
  const [progress, setProgress] = useState<PlayerProgress>({ positionMs: 0, durationMs: 0 });

  /**
   * Audio 엘리먼트 생성/해제
   * timeupdate·loadedmetadata·ended 리스너 등록
   */
  const { audioRef } = useItunesElement({ setProgress });

  /**
   * volume 동기화
   * 1곡 반복(loop)
   * 소스 교체
   * 재생/일시정지 제어
   */
  useItunesSync({ audioRef, setProgress });

  /**
   * seekToMs: player의 재생 시점 조정 함수 (SeekBar onClick 함수)
   */
  const { seekToMs } = useItunesProgress({ audioRef, progress, setProgress });

  return { ...progress, seekToMs };
};
