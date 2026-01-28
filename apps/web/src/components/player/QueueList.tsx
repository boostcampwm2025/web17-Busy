'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import { Box, Plus, ListPlus, Trash2, ChevronUp, ChevronDown, XCircle } from 'lucide-react';
import { useMusicActions } from '@/hooks';
import { useModalStore, MODAL_TYPES } from '@/stores';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';

interface QueueListProps {
  queue: Music[];
  currentMusicId: string | null;
  onClear: () => void;
  onRemove: (musicId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;

  /** 추가: 큐 아이템 선택(현재 재생 곡 변경) */
  onSelect: (music: Music) => void;
}

export default function QueueList({ queue, currentMusicId, onClear, onRemove, onMoveUp, onMoveDown, onSelect }: QueueListProps) {
  const isEmpty = queue.length === 0;

  /**
   * NOTE:
   * - 사용자의 로그인 유무를 체크한다.
   * - 사용자가 보관함 추가와 컨텐츠 생성 버튼을 누를 때 로그인 유무로 지원한다.
   * - 보관함을 누르면 로그인한 사용자 Id로 보관함 리스트 모달을 불러온다.
   */
  const { userId, isAuthenticated } = useAuthMe();
  const { openModal } = useModalStore();

  /** 보관함 추가와 컨텐츠 생성을 위한 함수  */
  const { openWriteModalWithQueue, addQueueToArchive } = useMusicActions();

  const handleClearClick = () => {
    if (isEmpty) return;
    onClear();
  };

  const handleArchive = async () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (isEmpty) return;
    await addQueueToArchive(queue);
  };

  const handleAdd = async () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (isEmpty) return;
    await openWriteModalWithQueue(queue);
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden bg-gray-4/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-primary flex items-center gap-2">
          <ListPlus className="w-5 h-5 text-accent-pink" />
          재생 목록
        </h3>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleArchive}
            disabled={isEmpty}
            title={'보관함 플레이리스트 저장'}
            className="p-2 bg-white border-2 border-primary rounded-md  disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Box className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleAdd}
            disabled={isEmpty}
            title={'새로운 컨텐츠 작성'}
            className="p-2 bg-accent-pink text-white border-2 border-primary rounded-md  disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleClearClick}
            disabled={isEmpty}
            title={isEmpty ? '큐가 비어있습니다' : '전체 비우기'}
            className="flex items-center gap-1 px-3 py-2 rounded-md border-2 border-primary text-primary font-bold text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <p className="font-bold text-gray-1">재생목록이 비어있습니다.</p>
            <p className="text-sm text-gray-2 mt-1">음악을 추가하면 여기에서 관리할 수 있어요.</p>
          </div>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-3 pr-1">
          {queue.map((music, index) => {
            const isCurrent = currentMusicId === music.id;

            const handleSelectClick = () => {
              onSelect(music);
            };

            const handleRemoveClick = () => {
              onRemove(music.id);
            };

            const handleMoveUpClick = () => {
              onMoveUp(index);
            };

            const handleMoveDownClick = () => {
              onMoveDown(index);
            };

            return (
              <li
                key={`${music.id}-${index}`}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                  isCurrent ? 'border-primary bg-white' : 'border-transparent hover:border-gray-3 hover:bg-white'
                }`}
              >
                <span className={`w-6 text-center text-sm font-bold ${isCurrent ? 'text-accent-pink' : 'text-gray-2'}`}>{index + 1}</span>

                {/* 클릭 영역: 커버 + 텍스트 ->  재생할 곡 지정 가능*/}
                <button type="button" onClick={handleSelectClick} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                  <img src={music.albumCoverUrl} alt={music.title} className="w-10 h-10 rounded border border-gray-3 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate ${isCurrent ? 'text-accent-pink' : 'text-primary'}`}>{music.title}</p>
                    <p className="text-xs text-gray-1 truncate">{music.artistName}</p>
                  </div>
                </button>

                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={handleMoveUpClick}
                    disabled={index === 0}
                    title="위로"
                    className="p-1 text-gray-1 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleMoveDownClick}
                    disabled={index === queue.length - 1}
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
          })}
        </ul>
      )}
    </div>
  );
}
