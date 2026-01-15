'use client';

import type { Music } from '@/types';
import { X, Trash2, ChevronUp, ChevronDown, XCircle, ListPlus } from 'lucide-react';

interface MobileQueueModalProps {
  isOpen: boolean;
  queue: Music[];
  currentMusicId: string | null;

  onClose: () => void;
  onClear: () => void;
  onPlay: (music: Music) => void;
  onRemove: (musicId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

interface MobileQueueRowProps {
  music: Music;
  index: number;
  isCurrent: boolean;
  isFirst: boolean;
  isLast: boolean;

  onPlay: (music: Music) => void;
  onRemove: (musicId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

function MobileQueueRow({ music, index, isCurrent, isFirst, isLast, onPlay, onRemove, onMoveUp, onMoveDown }: MobileQueueRowProps) {
  const handlePlayClick = () => {
    onPlay(music);
  };

  const handleRemoveClick = () => {
    onRemove(music.musicId);
  };

  const handleMoveUpClick = () => {
    onMoveUp(index);
  };

  const handleMoveDownClick = () => {
    onMoveDown(index);
  };

  return (
    <li className={`flex items-center gap-3 p-3 rounded-xl border-2 ${isCurrent ? 'border-primary bg-gray-4' : 'border-transparent bg-white'}`}>
      <span className={`w-6 text-center text-sm font-bold ${isCurrent ? 'text-accent-pink' : 'text-gray-2'}`}>{index + 1}</span>

      <button type="button" onClick={handlePlayClick} className="flex items-center gap-3 min-w-0 flex-1 text-left">
        <img src={music.albumCoverUrl} alt={music.title} className="w-10 h-10 rounded border border-gray-3 object-cover" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary truncate">{music.title}</p>
          <p className="text-xs font-bold text-gray-1 truncate">{music.artistName}</p>
        </div>
      </button>

      <div className="flex flex-col">
        <button
          type="button"
          onClick={handleMoveUpClick}
          disabled={isFirst}
          title="위로"
          className="p-1 text-gray-1 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleMoveDownClick}
          disabled={isLast}
          title="아래로"
          className="p-1 text-gray-1 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <button type="button" onClick={handleRemoveClick} title="삭제" className="p-2 text-gray-2 hover:text-accent-pink">
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}

export default function MobileQueueModal({
  isOpen,
  queue,
  currentMusicId,
  onClose,
  onClear,
  onPlay,
  onRemove,
  onMoveUp,
  onMoveDown,
}: MobileQueueModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = () => {
    onClose();
  };

  const handleCloseClick = () => {
    onClose();
  };

  const handleClearClick = () => {
    onClear();
  };

  // 바 높이: layout에서 h-24(= 6rem) 사용 중 → bottom-24로 띄움
  return (
    <>
      {/* Backdrop: bar 위 영역만 덮기 */}
      <div className="lg:hidden fixed inset-x-0 top-0 bottom-24 bg-primary/20 backdrop-blur-[2px] z-40" onClick={handleBackdropClick} />

      {/* Modal */}
      <section className="lg:hidden fixed inset-x-0 bottom-24 z-50 bg-white border-t-2 border-primary max-h-[55vh] rounded-t-2xl overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-gray-3">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-accent-pink" />
            <h3 className="font-black text-primary">재생 목록</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearClick}
              disabled={queue.length === 0}
              title={queue.length === 0 ? '큐가 비어있습니다' : '전체 비우기'}
              className="flex items-center gap-1 px-3 py-2 rounded-md border-2 border-primary text-primary font-bold text-sm
                         hover:bg-gray-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4" />
              Clear
            </button>

            <button type="button" onClick={handleCloseClick} title="닫기" className="p-2 text-primary hover:bg-gray-4 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-4 overflow-y-auto max-h-[55vh]">
          {queue.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-bold text-gray-1">재생목록이 비어있습니다.</p>
              <p className="text-sm text-gray-2 mt-1">음악을 추가하면 여기에서 관리할 수 있어요.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {queue.map((music, index) => (
                <MobileQueueRow
                  key={music.musicId}
                  music={music}
                  index={index}
                  isCurrent={currentMusicId === music.musicId}
                  isFirst={index === 0}
                  isLast={index === queue.length - 1}
                  onPlay={onPlay}
                  onRemove={onRemove}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
