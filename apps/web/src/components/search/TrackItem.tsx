'use client';

import { useState } from 'react';
import { Box, Play, PlusCircle } from 'lucide-react';
import type { Music } from '@/types';

interface TrackItemProps {
  music: Music;
  disabledActions?: boolean;

  onPlay?: (music: Music) => void;
  onAddToArchive?: (music: Music) => void;
  onOpenWrite?: (music: Music) => void;
}

const DISABLED_ACTION_TITLE = '추후 연결 예정';

export default function TrackItem({ music, disabledActions = false, onPlay, onAddToArchive, onOpenWrite }: TrackItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = (action?: (music: Music) => void) => {
    return () => {
      // 액션이 비활성화 상태이거나 다른 액션이 처리 중이면 중단
      if (disabledActions || isProcessing) {
        return;
      }

      setIsProcessing(true);
      try {
        action?.(music);
      } finally {
        // 액션 실행 후, 500ms 뒤에 다시 활성화 (연타 방지)
        setTimeout(() => setIsProcessing(false), 500);
      }
    };
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
        <button
          type="button"
          onClick={handleAction(onPlay)}
          disabled={disabledActions || isProcessing}
          title={disabledActions ? DISABLED_ACTION_TITLE : '재생'}
          className="p-2 rounded-lg border border-gray-3 bg-white text-primary hover:bg-gray-4
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleAction(onAddToArchive)}
          disabled={disabledActions || isProcessing}
          title={disabledActions ? DISABLED_ACTION_TITLE : '보관함 추가'}
          className="p-2 rounded-lg border border-gray-3 bg-white text-primary hover:bg-gray-4
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Box className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleAction(onOpenWrite)}
          disabled={disabledActions || isProcessing}
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
