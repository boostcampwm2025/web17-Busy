import { useEffect, useRef } from 'react';

import { usePlayerStore } from '@/stores/usePlayerStore';
import { PlayerProgress } from '@/types/player';
import { normalizeVolume, shouldRepeatSingle, toDurationMs } from '../playback-policy';

type Props = {
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
};

/**
 * Audio 엘리먼트의 수명과 이벤트를 맡는다. YouTube의 use-youtube-player에 대응한다.
 *
 * 그쪽과 달리 isReady를 돌려주지 않는 이유: new Audio()는 동기라 이 훅의 생성 effect가 끝나면
 * 곧바로 쓸 수 있고, 이 훅을 먼저 호출한 컴포저 덕에 뒤따르는 훅들의 effect는 항상 그 뒤에 돈다.
 */
export function useItunesElement({ setProgress }: Props) {
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const queueLength = usePlayerStore((s) => s.queue.length);
  const playNext = usePlayerStore((s) => s.playNext);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio 객체는 effect에서 1회 생성
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.volume = normalizeVolume(volume);

    audioRef.current = audio;
    setVolume(audio.volume); // store 기본값 동기화

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []); // 1회만

  // timeupdate/loadedmetadata/ended 이벤트로 progress 동기화
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress((prev) => ({ ...prev, positionMs: Math.floor(audio.currentTime * 1000) }));
    };

    const handleLoadedMetadata = () => {
      const durationMs = toDurationMs(audio.duration);
      setProgress((prev) => ({ ...prev, durationMs: durationMs || prev.durationMs }));
    };

    const handleEnded = () => {
      if (shouldRepeatSingle(queueLength)) return;
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
  }, [playNext, queueLength, setProgress]);

  return { audioRef };
}
