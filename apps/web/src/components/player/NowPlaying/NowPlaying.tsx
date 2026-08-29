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

export default function NowPlaying() {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const playError = usePlayerStore((s) => s.playError);

  const { isAuthenticated } = useAuthMe();
  const openModal = useModalStore((s) => s.openModal);
  const { openWriteModalWithMusic, addMusicToArchive } = useMusicActions();

  const isYouTube = currentMusic?.provider === MusicProvider.YOUTUBE;

  const handlePost = useCallback(() => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (!currentMusic) return;

    void openWriteModalWithMusic(currentMusic);
  }, [isAuthenticated, openModal, currentMusic, openWriteModalWithMusic]);

  const handleSave = useCallback(() => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (!currentMusic) return;

    void addMusicToArchive(currentMusic);
  }, [isAuthenticated, openModal, currentMusic, addMusicToArchive]);

  return (
    <div className="p-4 py-8 border-b-2 border-primary">
      <h2 className="text-xs font-bold text-accent-pink tracking-widest uppercase mb-4 text-center">Now Playing</h2>

      <PlaybackProvider>
        <NowPlayingCoverPlayback currentMusic={currentMusic} isYouTube={isYouTube} />
        <NowPlayingMetaActions currentMusic={currentMusic} playError={playError} onPost={handlePost} onSave={handleSave} />
        <NowPlayingProgressTick currentMusic={currentMusic} />
      </PlaybackProvider>

      <NowPlayingControlsStatic />
    </div>
  );
}
