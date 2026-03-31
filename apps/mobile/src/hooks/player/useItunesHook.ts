import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { usePlayerStore } from '@/src/stores';
import { MusicProvider } from '@repo/dto/values';

export function useItunesHook() {
  const soundRef = useRef<Audio.Sound | null>(null);

  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isItunes = currentMusic?.provider === MusicProvider.ITUNES;

  const queueLength = usePlayerStore((s) => s.queue.length);
  const playNext = usePlayerStore((s) => s.playNext);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const volume = usePlayerStore((s) => s.volume);
  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  // 앱 시작 시 오디오 모드 설정 (백그라운드 재생, 무음 모드 허용)
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });
  }, []);

  // Effect 1: 트랙 변경 시 Sound 교체
  useEffect(() => {
    setPlayError(null);

    const loadTrack = async () => {
      // 기존 사운드 해제
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (!currentMusic || !isItunes) {
        setPositionMs(0);
        setDurationMs(0);
        return;
      }

      const src = currentMusic.trackUri ?? '';
      if (!src) {
        setPlayError('재생할 수 있는 미리듣기 URL이 없습니다.');
        setPositionMs(0);
        setDurationMs(0);
        return;
      }

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: src },
          {
            shouldPlay: isPlaying,
            volume: volume,
            isLooping: queueLength <= 1,
          },
          (status) => {
            if (!status.isLoaded) return;
            setPositionMs(status.positionMillis);
            if (status.durationMillis) {
              setDurationMs(status.durationMillis);
            }
            if (status.didJustFinish && !status.isLooping) {
              playNext();
            }
          },
        );
        soundRef.current = sound;
        setPositionMs(0);
        setDurationMs(currentMusic.durationMs ?? 0);
      } catch {
        setPlayError('재생에 실패했습니다. 잠시 후 다시 시도해주세요.');
        togglePlay();
      }
    };

    loadTrack();

    return () => {
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMusic?.id, isItunes]);

  // Effect 2: 재생/일시정지 제어
  useEffect(() => {
    const sound = soundRef.current;
    if (!sound || !currentMusic || !isItunes) return;

    if (isPlaying) {
      sound.playAsync().catch(() => {
        setPlayError('재생에 실패했습니다. 잠시 후 다시 시도해주세요.');
        togglePlay();
      });
    } else {
      sound.pauseAsync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentMusic?.id, isItunes]);

  // Effect 3: 볼륨 동기화
  useEffect(() => {
    soundRef.current?.setVolumeAsync(volume);
  }, [volume]);

  // Effect 4: 루프 동기화 (1곡이면 반복)
  useEffect(() => {
    soundRef.current?.setIsLoopingAsync(queueLength <= 1);
  }, [queueLength]);

  const seekToMs = useCallback((ms: number) => {
    soundRef.current?.setPositionAsync(ms);
    setPositionMs(ms);
  }, []);

  return { positionMs, durationMs, seekToMs };
}
