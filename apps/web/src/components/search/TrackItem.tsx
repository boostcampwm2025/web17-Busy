import { Box, Plus } from 'lucide-react';

import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import useMusicActions from '@/hooks/common/use-music-actions';
import { ContentSearchMode } from '@/types/search';
import type { MusicResponseDto as Music } from '@repo/dto';
import TickerText from '@/components/common/TickerText';

interface TrackItemProps {
  mode: ContentSearchMode;
  item: Music;
  isAuthenticated: boolean;
}

export default function TrackItem({ mode, item, isAuthenticated }: TrackItemProps) {
  const openModal = useModalStore((s) => s.openModal);

  /** 재생 / 작성 모달 / 보관함 선택 */
  const { addMusicToPlayer, openWriteModalWithMusic, addMusicToArchive } = useMusicActions();

  const handlePlayClick = () => {
    void addMusicToPlayer(item);
  };

  const handleWriteClick = () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    void openWriteModalWithMusic(item);
  };

  const handleArchiveClick = () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    void addMusicToArchive(item);
  };

  const isVideo = mode === 'video';

  return (
    <div onClick={handlePlayClick} title="재생" className="w-full flex items-center p-3 rounded-xl cursor-pointer hover:bg-gray-4 transition-colors">
      <div
        className={`${isVideo ? 'h-14 aspect-video' : 'h-12 aspect-square'} mr-4 shrink-0 rounded-lg overflow-hidden border border-gray-3 bg-gray-4`}
      >
        <img src={item.albumCoverUrl} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <TickerText text={item.title} className="font-bold text-primary" />
        <TickerText text={item.artistName} className="text-xs text-gray-1" />
      </div>

      <div className="flex items-center gap-2 ml-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleArchiveClick();
          }}
          title="보관함에 추가"
          className="p-2 rounded-lg border border-gray-3 text-primary transition-all hover:bg-white hover:shadow-[2px_2px_0px_0px_#00ebc7]
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Box className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleWriteClick();
          }}
          title="추천 글 작성"
          className="p-2 rounded-lg border border-gray-3 text-primary transition-all hover:bg-white hover:shadow-[2px_2px_0px_0px_#00ebc7]
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
