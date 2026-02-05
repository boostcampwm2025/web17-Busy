'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import { MusicProvider } from '@repo/dto/values';
import { useCallback } from 'react';
import { useMusicActions } from '@/hooks';
import { useModalStore, MODAL_TYPES, usePlayerStore, useAuthStore } from '@/stores';
import { enqueueLog } from '@/utils';
import { makeArchiveAddMusicLog, makePostAddMusicLog } from '@/api';

import { NowPlayingCoverPlayback, NowPlayingProgressTick, NowPlayingMetaActions, NowPlayingControlsStatic, PlaybackProvider } from './index';

type Props = {
  currentMusic: Music | null;
  isPlaying: boolean;
  canPrev: boolean;
  canNext: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function NowPlaying({ currentMusic, isPlaying, canPrev, canNext, onTogglePlay, onPrev, onNext }: Props) {
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const playError = usePlayerStore((s) => s.playError);
  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { openModal } = useModalStore();
  const { openWriteModalWithMusic, addMusicToArchive } = useMusicActions();

  const isPlayable = Boolean(currentMusic);
  const isYouTube = currentMusic?.provider === MusicProvider.YOUTUBE;

  const clearPlayError = useCallback(() => setPlayError(null), [setPlayError]);

  const safeTogglePlay = useCallback(() => {
    if (!isPlayable) return;
    clearPlayError();
    onTogglePlay();
  }, [isPlayable, clearPlayError, onTogglePlay]);

  const safePrev = useCallback(() => {
    if (!canPrev) return;
    clearPlayError();
    onPrev();
  }, [canPrev, clearPlayError, onPrev]);

  const safeNext = useCallback(() => {
    if (!canNext) return;
    clearPlayError();
    onNext();
  }, [canNext, clearPlayError, onNext]);

  const handlePost = useCallback(async () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (!currentMusic) return;

    enqueueLog(makePostAddMusicLog({ musicIds: [currentMusic.id] }));
    await openWriteModalWithMusic(currentMusic);
  }, [isAuthenticated, openModal, currentMusic, openWriteModalWithMusic]);

  const handleSave = useCallback(async () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (!currentMusic) return;

    enqueueLog(makeArchiveAddMusicLog({ musicIds: [currentMusic.id] }));
    await addMusicToArchive(currentMusic);
  }, [isAuthenticated, openModal, currentMusic, addMusicToArchive]);

  return (
    <div className="p-4 py-8 border-b-2 border-primary">
      <h2 className="text-xs font-bold text-accent-pink tracking-widest uppercase mb-4 text-center">Now Playing</h2>

      <PlaybackProvider>
        <NowPlayingCoverPlayback currentMusic={currentMusic} isYouTube={isYouTube} />
        <NowPlayingMetaActions currentMusic={currentMusic} playError={playError} onPost={handlePost} onSave={handleSave} />
        <NowPlayingProgressTick currentMusic={currentMusic} />
      </PlaybackProvider>

      <NowPlayingControlsStatic
        enabled={Boolean(currentMusic)}
        isPlaying={isPlaying}
        canPrev={canPrev}
        canNext={canNext}
        onClearPlayError={clearPlayError}
        onTogglePlay={safeTogglePlay}
        onPrev={safePrev}
        onNext={safeNext}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  );
}
