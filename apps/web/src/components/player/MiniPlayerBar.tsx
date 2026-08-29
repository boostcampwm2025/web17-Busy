import { useState } from 'react';
import { Box, Pause, Play, Plus, SkipBack, SkipForward, ListPlus } from 'lucide-react';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import useMusicActions from '@/hooks/common/useMusicActions';
import { useQueueNavigation } from '@/hooks/player/use-queue-navigation';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';

import TickerText from '@/components/common/TickerText';
import MobileBottomSheet from '@/components/layout/MobileBottomSheet';
import QueueList from './QueueList/QueueList';

interface MiniPlayerBarProps {
  onOpenFullPlayer: () => void;
}

export default function MiniPlayerBar({ onOpenFullPlayer }: MiniPlayerBarProps) {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isPlayable = Boolean(currentMusic);

  const nav = useQueueNavigation();

  const openModal = useModalStore((s) => s.openModal);

  // 큐 시트는 앱 전역 모달이 아니라 이 바가 소유하는 UI다. 검색 드로어(MobileBottomNav)와 같은 방식.
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const { isAuthenticated } = useAuthMe();
  const { openWriteModalWithMusic, addMusicToArchive } = useMusicActions();

  const handleToggleQueueClick = () => {
    setIsQueueOpen((prev) => !prev);
  };

  const handleCloseQueue = () => {
    setIsQueueOpen(false);
  };

  const handlePostClick = () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (!currentMusic) return;

    void openWriteModalWithMusic(currentMusic);
  };

  const handleSaveClick = () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (!currentMusic) return;

    void addMusicToArchive(currentMusic);
  };

  const queueTitle = isQueueOpen ? '현재 재생목록 닫기' : '현재 재생목록 열기';

  return (
    <>
      <section className="relative z-20 flex lg:hidden h-full items-center gap-3 px-4 bg-white">
        <button type="button" onClick={onOpenFullPlayer} className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded border border-gray-3 overflow-hidden bg-gray-4 shrink-0">
            {currentMusic ? <img src={currentMusic.albumCoverUrl} alt={currentMusic.title} className="w-full h-full object-cover" /> : null}
          </div>

          <div className="min-w-0 flex-1 text-left">
            {currentMusic ? (
              <>
                <TickerText text={currentMusic.title} className="text-sm font-black text-primary" />
                <TickerText text={currentMusic.artistName} className="text-xs font-bold text-gray-1" />
              </>
            ) : (
              <>
                <p className="text-sm font-black text-primary">재생 중인 음악 없음</p>
                <p className="text-xs font-bold text-gray-1"> </p>
              </>
            )}
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={nav.playPrev}
            disabled={!nav.canPrev}
            title={nav.canPrev ? '이전 곡' : '이전 곡 없음'}
            className="p-2 text-primary rounded-full transition-colors enabled:hover:bg-gray-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={nav.togglePlay}
            disabled={!isPlayable}
            title={!isPlayable ? '재생할 음악이 없습니다' : isPlaying ? '일시정지' : '재생'}
            className="p-2 rounded-full bg-primary text-white transition-all enabled:hover:shadow-[2px_2px_0px_0px_#00ebc7] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={nav.playNext}
            disabled={!nav.canNext}
            title={nav.canNext ? '다음 곡' : '다음 곡 없음'}
            className="p-2 text-primary rounded-full transition-colors enabled:hover:bg-gray-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleToggleQueueClick}
            title={queueTitle}
            className="p-2 text-primary hover:bg-gray-4 rounded-full transition-colors hidden 2xs:block"
          >
            <ListPlus className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            title="보관함에 추가"
            className="p-2 rounded-lg border border-transparent text-primary transition-all hover:bg-white hover:border-accent-cyan hover:shadow-[2px_2px_0px_0px_#00ebc7] hidden sm:block"
          >
            <Box className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handlePostClick}
            title="추천 글 작성"
            className="p-2 rounded-lg border border-transparent text-primary transition-all hover:bg-white hover:border-accent-pink hover:shadow-[2px_2px_0px_0px_#ff5470] hidden sm:block"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </section>

      <MobileBottomSheet isOpen={isQueueOpen} title="재생 목록" onClose={handleCloseQueue} className="h-[70vh]">
        <QueueList shouldShowHeading={false} />
      </MobileBottomSheet>
    </>
  );
}
