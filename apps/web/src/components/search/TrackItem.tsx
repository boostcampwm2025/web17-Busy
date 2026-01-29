'use client';

import { Box, Play, PlusCircle } from 'lucide-react';

import { useModalStore, MODAL_TYPES } from '@/stores';
import { useMusicActions } from '@/hooks';
import { ContentSearchMode } from '@/types';
import type { MusicResponseDto as Music } from '@repo/dto';

interface TrackItemProps {
  mode: ContentSearchMode;
  item: Music;
  isAuthenticated: boolean;
}

export default function TrackItem({ mode, item, isAuthenticated }: TrackItemProps) {
  const { openModal } = useModalStore();

  /** 재생 / 작성 모달 / 보관함 선택  */
  const { addMusicToPlayer, openWriteModalWithMusic, addMusicToArchive } = useMusicActions();

  const handlePlayClick = async () => {
    // DB upsert 포함(내부 ensureMusicInDb)
    await addMusicToPlayer(item);
  };

  const handleWriteClick = async () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    // DB upsert 포함(내부 ensureMusicInDb)
    await openWriteModalWithMusic(item);
  };

  const handleArchiveClick = () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    // DB upsert 포함(내부 ensureMusicInDb)
    addMusicToArchive(item);
  };

  return (
    <div className="w-full flex items-center p-3 rounded-xl hover:bg-gray-4 transition-colors">
      <div
        className={`${mode === 'video' ? 'h-14 aspect-video' : 'h-12 aspect-square'} mr-4 shrink-0 rounded-lg overflow-hidden border border-gray-3 bg-gray-4`}
      >
        <img src={item.albumCoverUrl} alt={item.title} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-bold text-primary ${mode === 'video' ? 'line-clamp-2' : 'truncate'}`}>{item.title}</p>
        <p className="text-xs text-gray-1 truncate">{item.artistName}</p>
      </div>

      <div className="flex items-center gap-2 ml-3">
        {/* 재생은 항상 가능(미리듣기든 플레이어든 onPlay로 위임) */}
        <button
          type="button"
          onClick={handlePlayClick}
          title="재생"
          className="p-2 rounded-lg border border-gray-3 bg-white text-primary hover:bg-gray-4"
        >
          <Play className="w-4 h-4" />
        </button>

        {/* 보관함 */}
        <button
          type="button"
          onClick={handleArchiveClick}
          title="보관함 선택 추가"
          className="p-2 rounded-lg border border-gray-3 bg-white text-primary hover:bg-gray-4
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Box className="w-4 h-4" />
        </button>

        {/* 작성 */}
        <button
          type="button"
          onClick={handleWriteClick}
          title="컨텐츠 작성"
          className="p-2 rounded-lg border border-gray-3 bg-white text-primary hover:bg-gray-4
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
