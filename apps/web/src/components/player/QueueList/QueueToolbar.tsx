import { Box, ListPlus, Plus, XCircle } from 'lucide-react';

import useMusicActions from '@/hooks/common/use-music-actions';
import { useAuthMe } from '@/hooks/auth/client/use-auth-me';
import { MODAL_TYPES, useModalStore } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';

type Props = {
  /** 바텀시트처럼 바깥에서 이미 제목을 보여주는 곳에서는 끈다. */
  shouldShowHeading?: boolean;
};

export default function QueueToolbar({ shouldShowHeading = true }: Props) {
  const queue = usePlayerStore((s) => s.queue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const isEmpty = queue.length === 0;

  const { isAuthenticated } = useAuthMe();
  const openModal = useModalStore((s) => s.openModal);
  const { openWriteModalWithQueue, addQueueToArchive } = useMusicActions();

  const handleArchiveClick = () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (isEmpty) return;

    void addQueueToArchive(queue);
  };

  const handleAddClick = () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (isEmpty) return;

    void openWriteModalWithQueue(queue);
  };

  const handleClearClick = () => {
    if (isEmpty) return;
    clearQueue();
  };

  return (
    <div className={`flex items-center mb-4 ${shouldShowHeading ? 'justify-between' : 'justify-end'}`}>
      {shouldShowHeading && (
        <h3 className="font-black text-primary flex items-center gap-2">
          <ListPlus className="w-5 h-5 text-accent-pink" />
          재생 목록
        </h3>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleArchiveClick}
          disabled={isEmpty}
          title="현재 재생목록을 보관함에 추가"
          className="p-2 bg-white border-2 border-primary rounded-md transition-all enabled:hover:shadow-[2px_2px_0px_0px_#00ebc7] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Box className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleAddClick}
          disabled={isEmpty}
          title="현재 재생목록으로 추천 글 작성"
          className="p-2 bg-accent-pink text-white border-2 border-primary rounded-md transition-all enabled:hover:shadow-[2px_2px_0px_0px_#00ebc7] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleClearClick}
          disabled={isEmpty}
          title={isEmpty ? '큐가 비어있습니다' : '전체 비우기'}
          className="flex items-center gap-1 px-3 py-2 rounded-md border-2 border-primary text-primary font-bold text-sm transition-all hover:bg-white enabled:hover:shadow-[2px_2px_0px_0px_#00ebc7] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="w-4 h-4" />
          Clear
        </button>
      </div>
    </div>
  );
}
