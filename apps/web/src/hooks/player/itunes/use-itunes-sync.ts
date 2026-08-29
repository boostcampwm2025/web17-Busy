import { useEffect } from 'react';
import { MusicProvider } from '@repo/dto/values';

import { usePlayerStore } from '@/stores/usePlayerStore';
import { PlayerProgress } from '@/types/player';
import { normalizeVolume, shouldRepeatSingle } from '../playback-policy';

type Props = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
};

const toPlaybackErrorMessage = (e: unknown): string => {
  if (e instanceof DOMException) {
    if (e.name === 'NotAllowedError') return '재생을 시작하려면 화면을 한 번 터치/클릭해주세요.';
    if (e.name === 'NotSupportedError') return '이 오디오는 재생을 지원하지 않습니다.';
  }
  return '재생에 실패했습니다. 잠시 후 다시 시도해주세요.';
};

/** store 상태를 Audio 엘리먼트에 반영한다. YouTube의 use-youtube-sync에 대응한다. */
export function useItunesSync({ audioRef, setProgress }: Props) {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const queueLength = usePlayerStore((s) => s.queue.length);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const isItunes = currentMusic?.provider === MusicProvider.ITUNES;

  // volume 동기화 (UI에서 바꿀 때 반영)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = normalizeVolume(volume);
  }, [audioRef, volume]);

  // 1곡이면 loop=true로 안정적으로 반복
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = shouldRepeatSingle(queueLength);
  }, [audioRef, queueLength]);

  // 소스 교체: currentMusic 변경 시에만 실행 (pause 토글로 재실행되면 안 됨)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 재생 실패 메시지는 트랙 변경 시 초기화
    setPlayError(null);

    if (!currentMusic || !isItunes) {
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
  }, [audioRef, setProgress, currentMusic, isItunes, setPlayError]);

  // 재생/일시정지 제어: 여기서만 play/pause 수행
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentMusic || !isItunes) return;

    if (!isPlaying) {
      audio.pause();
      return;
    }

    void audio.play().catch((e) => {
      setPlayError(toPlaybackErrorMessage(e));
      togglePlay();
    });
  }, [audioRef, isPlaying, currentMusic?.id, currentMusic, isItunes, togglePlay, setPlayError]);
}
