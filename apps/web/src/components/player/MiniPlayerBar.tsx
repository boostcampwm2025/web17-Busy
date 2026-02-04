'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import { FolderPlus, Pause, Play, PlusCircle, SkipBack, SkipForward, ListPlus } from 'lucide-react';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { useMusicActions } from '@/hooks';
import { enqueueLog } from '@/utils';
import { makeArchiveAddMusicLog, makePostAddMusicLog } from '@/api';
import { useAuthStore } from '@/stores';

interface MiniPlayerBarProps {
  currentMusic: Music | null;
  isPlaying: boolean;

  canPrev: boolean;
  canNext: boolean;

  isQueueOpen: boolean;

  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;

  onToggleQueue: () => void;
}

export default function MiniPlayerBar({
  currentMusic,
  isPlaying,
  canPrev,
  canNext,
  isQueueOpen,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleQueue,
}: MiniPlayerBarProps) {
  const isPlayable = Boolean(currentMusic);

  /**
   * NOTE:
   * - 사용자의 로그인 유무를 체크한다.
   * - 사용자가 보관함 추가와 컨텐츠 생성 버튼을 누를 때 로그인 유무로 지원한다.
   * - 보관함을 누르면 로그인한 사용자 Id로 보관함 리스트 모달을 불러온다.
   */
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { openModal } = useModalStore();

  /** 보관함 추가와 컨텐츠 생성을 위한 함수  */
  const { openWriteModalWithMusic, addMusicToArchive } = useMusicActions();

  const handleTogglePlayClick = () => {
    if (!isPlayable) {
      return;
    }
    onTogglePlay();
  };

  const handlePrevClick = () => {
    if (!canPrev) {
      return;
    }
    onPrev();
  };

  const handleNextClick = () => {
    if (!canNext) {
      return;
    }
    onNext();
  };

  const handleToggleQueueClick = () => {
    onToggleQueue();
  };

  const handlePostClick = async () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (!currentMusic) return;

    enqueueLog(makePostAddMusicLog({ musicIds: [currentMusic.id] }));

    // DB upsert 포함(내부 ensureMusicInDb)
    await openWriteModalWithMusic(currentMusic);
  };

  const handleSaveClick = async () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (!currentMusic) return;

    enqueueLog(makeArchiveAddMusicLog({ musicIds: [currentMusic.id] }));
    // DB upsert 포함(내부 ensureMusicInDb)
    await addMusicToArchive(currentMusic);
  };

  const queueTitle = isQueueOpen ? '재생목록 닫기' : '재생목록 열기';

  return (
    <section className="relative z-20 flex lg:hidden h-full items-center gap-3 px-4 bg-white">
      <div className="w-12 h-12 rounded border border-gray-3 overflow-hidden bg-gray-4 shrink-0">
        {currentMusic ? <img src={currentMusic.albumCoverUrl} alt={currentMusic.title} className="w-full h-full object-cover" /> : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-primary truncate">{currentMusic ? currentMusic.title : '재생 중인 음악 없음'}</p>
        <p className="text-xs font-bold text-gray-1 truncate">{currentMusic ? currentMusic.artistName : ' '}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handlePrevClick}
          disabled={!canPrev}
          title={canPrev ? '이전 곡' : '이전 곡 없음'}
          className="p-2 text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleTogglePlayClick}
          disabled={!isPlayable}
          title={!isPlayable ? '재생할 음악이 없습니다' : isPlaying ? '일시정지' : '재생'}
          className="p-2 rounded-full bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={handleNextClick}
          disabled={!canNext}
          title={canNext ? '다음 곡' : '다음 곡 없음'}
          className="p-2 text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        {/* 재생목록 열기/닫기 */}
        <button
          type="button"
          onClick={handleToggleQueueClick}
          title={queueTitle}
          className="p-2 text-primary hover:bg-gray-4 rounded-full transition-colors hidden 2xs:block"
        >
          <ListPlus className="w-5 h-5" />
        </button>

        <button type="button" onClick={handlePostClick} title={'컨텐츠 생성'} className="p-2 text-primary hidden sm:block">
          <PlusCircle className="w-5 h-5" />
        </button>

        <button type="button" onClick={handleSaveClick} title={'보관함 선택 후 추가'} className="p-2 text-primary hidden sm:block">
          <FolderPlus className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
