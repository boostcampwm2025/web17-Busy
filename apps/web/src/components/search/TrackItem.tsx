'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import { Box, Play, PlusCircle } from 'lucide-react';

interface TrackItemProps {
  music: Music;

  /** 보관함/작성 등 후속 이슈에서 연결 */
  disabledActions?: boolean;

  onPlay?: (music: Music) => void;
  onAddToArchive?: (music: Music) => void;
  onOpenWrite?: (music: Music) => void;
}

const DISABLED_ACTION_TITLE = '추후 연결 예정';

export default function TrackItem({ music, disabledActions = true, onPlay, onAddToArchive, onOpenWrite }: TrackItemProps) {
  const handlePlayClick = () => {
    onPlay?.(music);
  };

  const handleArchiveClick = () => {
    if (disabledActions) return;
    onAddToArchive?.(music);
  };

  const handleWriteClick = () => {
    if (disabledActions) return;
    onOpenWrite?.(music);
  };

  return (
    <div className="w-full flex items-center p-3 rounded-xl hover:bg-gray-4 transition-colors">
      <div className="w-12 h-12 mr-4 shrink-0 rounded-lg overflow-hidden border border-gray-3 bg-gray-4">
        <img src={music.albumCoverUrl} alt={music.title} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-primary truncate">{music.title}</p>
        <p className="text-xs text-gray-1 truncate">{music.artistName}</p>
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

        {/* 보관함: 아직 미구현이면 disabled 고정(정책 유지) */}
        <button
          type="button"
          onClick={handleArchiveClick}
          disabled
          title={DISABLED_ACTION_TITLE}
          className="p-2 rounded-lg border border-gray-3 bg-white text-primary hover:bg-gray-4
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Box className="w-4 h-4" />
        </button>

        {/* 작성: disabledActions가 true면 잠금 */}
        <button
          type="button"
          onClick={handleWriteClick}
          disabled={disabledActions}
          title={disabledActions ? DISABLED_ACTION_TITLE : '컨텐츠 작성'}
          className="p-2 rounded-lg border border-gray-3 bg-white text-primary hover:bg-gray-4
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
