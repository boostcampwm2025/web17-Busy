import { X, XCircle, ListPlus } from 'lucide-react';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';

import MobileQueueRow from './partials/MobileQueueRow';

export default function MobileNowPlaylistModal() {
  const isOpen = useModalStore((s) => s.isOpen);
  const modalType = useModalStore((s) => s.modalType);
  const closeModal = useModalStore((s) => s.closeModal);
  const isQueueModalOpen = isOpen && modalType === MODAL_TYPES.MOBILE_QUEUE;

  const queue = usePlayerStore((s) => s.queue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const isEmpty = queue.length === 0;

  if (!isQueueModalOpen) return null;

  // 플레이어(h-16) + 네비(h-16) = bottom-32
  return (
    <>
      <div className="lg:hidden fixed inset-x-0 top-0 bottom-32 bg-primary/20 backdrop-blur-[2px] z-40" onClick={closeModal} />

      <section className="lg:hidden fixed inset-x-0 bottom-32 z-50 bg-white border-t-2 border-primary max-h-[55vh] rounded-t-2xl overflow-hidden flex flex-col animate-slide-up">
        <header className="flex items-center justify-between p-4 border-b border-gray-3">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-accent-pink" />
            <h3 className="font-black text-primary">재생 목록</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearQueue}
              disabled={isEmpty}
              title={isEmpty ? '큐가 비어있습니다' : '전체 비우기'}
              className="flex items-center gap-1 px-3 py-2 rounded-md border-2 border-primary text-primary font-bold text-sm enabled:hover:bg-gray-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4" />
              Clear
            </button>

            <button type="button" onClick={closeModal} title="닫기" className="p-2 text-primary hover:bg-gray-4 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 overflow-y-auto">
          {isEmpty ? (
            <div className="py-10 text-center">
              <p className="font-bold text-gray-1">재생목록이 비어있습니다.</p>
              <p className="text-sm text-gray-2 mt-1">음악을 추가하면 여기에서 관리할 수 있어요.</p>
            </div>
          ) : (
            <ul className="space-y-3 pb-4">
              {queue.map((music, index) => (
                <MobileQueueRow key={`${music.id}-${index}`} music={music} index={index} isLast={index === queue.length - 1} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
