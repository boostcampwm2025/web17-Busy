import { MusicProvider } from '@repo/dto/values';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useCurrentMusicActions } from '@/hooks/player/use-current-music-actions';

import { PlaybackProvider } from './partials/PlaybackProvider';
import NowPlayingCoverPlayback from './partials/NowPlayingCoverPlayback';
import NowPlayingProgressTick from './partials/NowPlayingProgressTick';
import NowPlayingMetaActions from './partials/NowPlayingMetaActions';
import NowPlayingControlsStatic from './partials/NowPlayingControlsStatic';

export default function NowPlaying() {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const playError = usePlayerStore((s) => s.playError);

  const musicActions = useCurrentMusicActions();

  const isYouTube = currentMusic?.provider === MusicProvider.YOUTUBE;

  return (
    <div className="p-4 py-8 border-b-2 border-primary">
      <h2 className="text-xs font-bold text-accent-pink tracking-widest uppercase mb-4 text-center">Now Playing</h2>

      <PlaybackProvider>
        <NowPlayingCoverPlayback currentMusic={currentMusic} isYouTube={isYouTube} />
        <NowPlayingMetaActions currentMusic={currentMusic} playError={playError} onPost={musicActions.post} onSave={musicActions.save} />
        <NowPlayingProgressTick currentMusic={currentMusic} />
      </PlaybackProvider>

      <NowPlayingControlsStatic />
    </div>
  );
}
