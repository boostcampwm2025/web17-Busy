'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import { MusicProvider } from '@repo/dto/values';
import { Pause, Play, Shuffle, SkipBack, SkipForward, PlusCircle, FolderPlus } from 'lucide-react';
import { useMemo } from 'react';
import { usePlayerStore } from '@/stores';
import { VolumeControl, SeekBar } from './index';
import { useMusicActions, useSearchDrawer } from '@/hooks';
import { useModalStore, MODAL_TYPES } from '@/stores';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { formatMs } from '@/utils';
import { useYouTubePlayer } from '@/hooks/youtube/useYouTubePlayer';

interface NowPlayingProps {
  currentMusic: Music | null;
  isPlaying: boolean;

  canPrev: boolean;
  canNext: boolean;

  positionMs: number;
  durationMs: number;

  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;

  onShuffle: () => void;
  onSeek: (ms: number) => void;
}

export default function NowPlaying(props: NowPlayingProps) {
  const { currentMusic, isPlaying, canPrev, canNext, positionMs, durationMs, onTogglePlay, onPrev, onNext, onShuffle } = props;

  const isPlayable = Boolean(currentMusic);

  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const playError = usePlayerStore((s) => s.playError);
  const setPlayError = usePlayerStore((s) => s.setPlayError);

  /**
   * NOTE:
   * - 사용자의 로그인 유무를 체크한다.
   * - 사용자가 보관함 추가와 컨텐츠 생성 버튼을 누를 때 로그인 유무로 지원한다.
   * - 보관함을 누르면 로그인한 사용자 Id로 보관함 리스트 모달을 불러온다.
   */
  const { userId, isAuthenticated } = useAuthMe();
  const { openModal } = useModalStore();

  /** 보관함 추가와 컨텐츠 생성을 위한 함수  */
  const { openWriteModalWithMusic, addMusicToArchive } = useMusicActions();

  const shownDurationMs = useMemo(() => {
    if (!currentMusic) return 0;
    return durationMs > 0 ? durationMs : currentMusic.durationMs;
  }, [currentMusic, durationMs]);

  const currentText = useMemo(() => formatMs(positionMs), [positionMs]);
  const durationText = useMemo(() => formatMs(shownDurationMs), [shownDurationMs]);

  const handleTogglePlayClick = () => {
    if (!isPlayable) return;
    setPlayError(null);
    onTogglePlay();
  };

  const handlePrevClick = () => {
    if (!canPrev) return;
    setPlayError(null);
    onPrev();
  };

  const handleNextClick = () => {
    if (!canNext) return;
    setPlayError(null);
    onNext();
  };

  const handleShuffleClick = () => {
    onShuffle();
  };

  const handlePostClick = async () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }

    if (!currentMusic) return;

    // DB upsert 포함(내부 ensureMusicInDb)
    await openWriteModalWithMusic(currentMusic);
  };

  const handleSaveClick = async () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }

    if (!currentMusic) return;

    // DB upsert 포함(내부 ensureMusicInDb)
    await addMusicToArchive(currentMusic);
  };

  return (
    <div className="p-4 border-b-2 border-primary">
      <h2 className="text-xs font-bold text-accent-pink tracking-widest uppercase mb-2 text-center">Now Playing</h2>

      <div className="mx-auto w-full max-w-55 aspect-square rounded-2xl border-2 border-primary overflow-hidden bg-gray-4 mb-2 flex items-center justify-center">
        {currentMusic ? (
          <img src={currentMusic.albumCoverUrl} alt={currentMusic.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-gray-2">No Music</span>
        )}
      </div>

      <div className="text-center mb-2">
        {currentMusic ? (
          <>
            <h3 className="text-lg font-black text-primary truncate">{currentMusic.title}</h3>
            <p className="text-xs font-bold text-gray-1 truncate">{currentMusic.artistName}</p>
          </>
        ) : (
          <>
            <p className="font-bold text-gray-1">재생 중인 음악이 없습니다.</p>
            <p className="text-sm text-gray-2 mt-1">피드/검색에서 음악을 선택해보세요.</p>
          </>
        )}
      </div>

      {/* 재생 실패 메시지(토스트 대신 인라인) */}
      {currentMusic && playError ? (
        <div className="mb-3 rounded-xl border-2 border-secondary bg-secondary/10 px-3 py-2 text-sm font-bold text-secondary">{playError}</div>
      ) : null}

      {currentMusic && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            type="button"
            onClick={handlePostClick}
            title={'컨텐츠 작성'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-white font-bold text-xs opacity-50 cursor-not-allowed"
          >
            <PlusCircle className="w-4 h-4" />
            게시
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            title={'보관함에 음악 추가'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-primary text-primary font-bold text-xs opacity-50 cursor-not-allowed"
          >
            <FolderPlus className="w-4 h-4" />
            저장
          </button>
        </div>
      )}

      <div className={`mb-3${currentMusic ? '' : ' opacity-50'}`}>
        {/* 진행바 + seek */}
        <SeekBar positionMs={positionMs} durationMs={shownDurationMs} disabled={!currentMusic || shownDurationMs <= 0} onSeek={props.onSeek} />
        <div className="flex justify-between text-[11px] font-bold text-gray-2 mt-2">
          <span>{currentMusic ? currentText : '0:00'}</span>
          <span>{currentMusic ? durationText : '0:00'}</span>
        </div>
      </div>

      <div className={`flex items-center justify-center gap-4${currentMusic ? '' : ' opacity-50'}`}>
        <button type="button" onClick={handleShuffleClick} disabled title={'랜덤 재생 버튼'} className="text-gray-2 opacity-50 cursor-not-allowed">
          <Shuffle className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handlePrevClick}
          disabled={!!currentMusic && !canPrev}
          title={canPrev ? '이전 곡' : '이전 곡 없음'}
          className={currentMusic ? 'text-primary disabled:opacity-50 disabled:cursor-not-allowed' : 'text-gray-2 cursor-not-allowed'}
        >
          <SkipBack className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={handleTogglePlayClick}
          disabled={!currentMusic}
          className={
            currentMusic
              ? 'w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-[3px_3px_0px_0px_#00ebc7]'
              : 'w-12 h-12 rounded-full bg-gray-2 text-white flex items-center justify-center cursor-not-allowed'
          }
          title={isPlaying ? '일시정지' : '재생'}
        >
          {currentMusic && isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={handleNextClick}
          disabled={!!currentMusic && !canNext}
          title={canNext ? '다음 곡' : '다음 곡 없음'}
          className={currentMusic ? 'text-primary disabled:opacity-50 disabled:cursor-not-allowed' : 'text-gray-2 cursor-not-allowed'}
        >
          <SkipForward className="w-6 h-6" />
        </button>
        <VolumeControl value={volume} onChange={setVolume} disabled={!currentMusic} />
      </div>
    </div>
  );
}
