'use client';

import { X, Trash2, ChevronUp, ChevronDown, XCircle, ListPlus } from 'lucide-react';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores';
import { MusicResponseDto as Music } from '@repo/dto';

type MobileQueueRowProps = {
  music: Music;
  index: number;
  isCurrent: boolean;
  isFirst: boolean;
  isLast: boolean;

  onPlay: (music: Music) => void;
  onRemove: (musicId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
};

function MobileQueueRow({ music, index, isCurrent, isFirst, isLast, onPlay, onRemove, onMoveUp, onMoveDown }: MobileQueueRowProps) {
  return (
    <li className={`flex items-center gap-3 p-3 rounded-xl border-2 ${isCurrent ? 'border-primary bg-gray-4' : 'border-transparent bg-white'}`}>
      <span className={`w-6 text-center text-sm font-bold ${isCurrent ? 'text-accent-pink' : 'text-gray-2'}`}>{index + 1}</span>

      <button type="button" onClick={() => onPlay(music)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
        <img src={music.albumCoverUrl} alt={music.title} className="w-10 h-10 rounded border border-gray-3 object-cover" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary truncate">{music.title}</p>
          <p className="text-xs font-bold text-gray-1 truncate">{music.artistName}</p>
        </div>
      </button>

      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onMoveUp(index)}
          disabled={isFirst}
          title="위로"
          className="p-1 text-gray-1 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(index)}
          disabled={isLast}
          title="아래로"
          className="p-1 text-gray-1 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <button type="button" onClick={() => onRemove(music.id)} title="삭제" className="p-2 text-gray-2 hover:text-accent-pink">
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}

export default function MobilePlayerModal() {
  const { isOpen, modalType, closeModal } = useModalStore();
  const enabled = isOpen && modalType === MODAL_TYPES.MOBILE_QUEUE;

  const queue = usePlayerStore((s) => s.queue);
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.id ?? null);

  const playMusic = usePlayerStore((s) => s.playMusic);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const moveUp = usePlayerStore((s) => s.moveUp);
  const moveDown = usePlayerStore((s) => s.moveDown);

  if (!enabled) return null;

  // 바 높이: layout에서 h-24(= 6rem) 사용 중 → bottom-24로 띄움
  return (
    <>
      {/* Backdrop: bar 위 영역만 덮기 */}
      <div className="lg:hidden fixed inset-x-0 top-0 bottom-24 bg-primary/20 backdrop-blur-[2px] z-40" onClick={closeModal} />

      {/* Modal */}
      <section className="lg:hidden fixed inset-x-0 bottom-24 z-50 bg-white border-t-2 border-primary max-h-[55vh] rounded-t-2xl overflow-hidden flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-3">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-accent-pink" />
            <h3 className="font-black text-primary">재생 목록</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearQueue}
              disabled={queue.length === 0}
              title={queue.length === 0 ? '큐가 비어있습니다' : '전체 비우기'}
              className="flex items-center gap-1 px-3 py-2 rounded-md border-2 border-primary text-primary font-bold text-sm hover:bg-gray-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4" />
              Clear
            </button>

            <button type="button" onClick={closeModal} title="닫기" className="p-2 text-primary hover:bg-gray-4 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 스크롤 영역: 남은 높이를 전부 사용 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-bold text-gray-1">재생목록이 비어있습니다.</p>
              <p className="text-sm text-gray-2 mt-1">음악을 추가하면 여기에서 관리할 수 있어요.</p>
            </div>
          ) : (
            <ul className="space-y-3  pb-4">
              {queue.map((music, index) => (
                <MobileQueueRow
                  key={`${music.id}-${index}`}
                  music={music}
                  index={index}
                  isCurrent={currentMusicId === music.id}
                  isFirst={index === 0}
                  isLast={index === queue.length - 1}
                  onPlay={playMusic}
                  onRemove={removeFromQueue}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
