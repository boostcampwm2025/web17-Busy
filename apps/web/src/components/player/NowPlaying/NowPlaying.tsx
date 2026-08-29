import type { MusicResponseDto as Music } from '@repo/dto';
import { MusicProvider } from '@repo/dto/values';
import { useCallback } from 'react';
import useMusicActions from '@/hooks/common/useMusicActions';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';

import { PlaybackProvider } from './partials/PlaybackProvider';
import NowPlayingCoverPlayback from './partials/NowPlayingCoverPlayback';
import NowPlayingProgressTick from './partials/NowPlayingProgressTick';
import NowPlayingMetaActions from './partials/NowPlayingMetaActions';
import NowPlayingControlsStatic from './partials/NowPlayingControlsStatic';

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

  const { isAuthenticated } = useAuthMe();
  const openModal = useModalStore((s) => s.openModal);
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

    await openWriteModalWithMusic(currentMusic);
  }, [isAuthenticated, openModal, currentMusic, openWriteModalWithMusic]);

  const handleSave = useCallback(async () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (!currentMusic) return;

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
        isEnabled={Boolean(currentMusic)}
        isPlaying={isPlaying}
        canPrev={canPrev}
        canNext={canNext}
        onTogglePlay={safeTogglePlay}
        onPrev={safePrev}
        onNext={safeNext}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  );
}
