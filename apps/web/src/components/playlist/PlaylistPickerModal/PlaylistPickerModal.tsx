'use client';

import { useEffect } from 'react';
import { X, Plus } from 'lucide-react';

import { useModalStore } from '@/stores/useModalStore';
import type { MusicResponseDto as Music } from '@repo/dto';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ModalShell } from '@/components/common/ModalShell';
import { usePlaylistPicker } from '@/hooks/playlist/use-playlist-picker';
import { PlaylistPickerItem } from './partials/PlaylistPickerItem';

type Props = {
  musics?: Music[];
};

export default function PlaylistPickerModal({ musics = [] }: Props) {
  const closeModal = useModalStore((s) => s.closeModal);

  // ModalContainer가 이 컴포넌트를 열 때 항상 musics를 함께 넘기지만, 방어적으로 한 번 더 확인한다.
  useEffect(() => {
    if (musics.length === 0) closeModal();
  }, [musics, closeModal]);

  const { playlists, isLoading, isFetching, errorMsg, emptyText, canSubmit, isCreating, submittingPlaylistId, handleSelect, handleCreateAndSave } =
    usePlaylistPicker({ musics, onSaved: closeModal });

  return (
    <ModalShell onClose={closeModal} size="md" cardClassName="max-h-[70vh]">
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white">
        <h2 className="text-xl font-black text-primary">플레이리스트 선택</h2>
        <button onClick={closeModal} className="p-1 hover:bg-grayish rounded-full transition-colors">
          <X className="w-6 h-6 text-primary" />
        </button>
      </div>

      <div className="px-6 py-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => void handleCreateAndSave()}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-white font-black text-primary py-3
                     hover:bg-grayish disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? '생성/저장 중…' : '새 플레이리스트 만들고 저장'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {isLoading || (isFetching && playlists.length === 0) ? (
          <div className="py-6">
            <LoadingSpinner />
          </div>
        ) : errorMsg ? (
          <div className="py-10 text-center text-gray-2">
            <p className="font-bold text-sm">{errorMsg}</p>
          </div>
        ) : emptyText ? (
          <div className="py-10 text-center text-gray-2">
            <p className="font-bold text-sm">{emptyText}</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {playlists.map((pl) => (
              <PlaylistPickerItem key={pl.id} playlist={pl} busy={submittingPlaylistId === pl.id} disabled={!canSubmit} onSelect={handleSelect} />
            ))}
          </ul>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 text-[11px] text-gray-2">저장할 플레이리스트를 선택하세요.</div>
    </ModalShell>
  );
}
