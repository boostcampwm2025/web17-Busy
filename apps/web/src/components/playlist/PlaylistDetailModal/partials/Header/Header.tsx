import { Check, Pencil, Play, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';

import ConfirmOverlay from '@/components/common/ConfirmOverlay';
import { DEFAULT_IMAGES } from '@/constants/defaultImages';
import { MAX_PLAYLIST_TITLE_LENGTH } from '@/constants/playlist';
import { useConfirm } from '@/hooks/common/use-confirm';
import { usePlaylistDetailQuery } from '@/hooks/playlist/use-playlist-detail-query';
import { useDeletePlaylistMutation, useRenamePlaylistMutation } from '@/hooks/playlist/use-playlist-mutations';
import { usePlaylistTitleEditing } from '@/hooks/playlist/use-playlist-title-editing';
import { useModalStore } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { IconButton } from './IconButton';

export function Header({ playlistId }: { playlistId: string }) {
  const closeModal = useModalStore((s) => s.closeModal);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const selectMusic = usePlayerStore((s) => s.selectMusic);

  // 부모와 같은 query key라 요청은 한 번만 나간다. 파생값을 props로 받는 대신 캐시에서 직접 읽는다.
  const { data: playlist } = usePlaylistDetailQuery(playlistId);
  const songs = playlist?.musics ?? [];
  const title = playlist?.title ?? '';

  const { mutate: renamePlaylist } = useRenamePlaylistMutation({ playlistId });
  const { mutate: removePlaylist } = useDeletePlaylistMutation({ playlistId, onDeleted: closeModal });

  const { isEditing, draft, isInvalid, start, change, commit, cancel } = usePlaylistTitleEditing({
    title,
    onRename: (nextTitle) => renamePlaylist(nextTitle, { onError: () => toast.error('플레이리스트 이름 변경에 실패했습니다.') }),
  });

  const deleteConfirm = useConfirm(() => removePlaylist(undefined, { onError: () => toast.error('플레이리스트 삭제에 실패했습니다.') }));

  const handlePlayAll = () => {
    if (songs.length === 0) return;

    addToQueue(songs);
    selectMusic(songs[0]!);
  };

  return (
    <div className="relative bg-grayish border-b-2 border-primary p-6">
      <div className="flex items-center space-x-6">
        {/* Cover */}
        <div className="relative w-28 h-28 shrink-0">
          <div className="absolute inset-0 bg-primary translate-x-1 translate-y-1 rounded-xl"></div>
          <img
            src={songs[0]?.albumCoverUrl || DEFAULT_IMAGES.ALBUM}
            alt={title}
            className="relative w-full h-full object-cover rounded-xl border-2 border-primary z-10"
          />
          <div className="absolute -bottom-2 -right-2 z-20 bg-accent-pink text-white text-xs font-bold px-2 py-0.5 rounded-full border border-primary">
            {songs.length}곡
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            {isEditing ? (
              <div className="flex items-center gap-2 w-full">
                <div>
                  <input
                    autoFocus
                    className="w-full text-2xl font-black text-primary rounded-md border-2 border-primary px-2 py-1 focus:outline-none"
                    value={draft}
                    onChange={(e) => change(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        commit();
                      }
                      if (e.key === 'Escape') {
                        cancel();
                      }
                    }}
                  />
                  {isInvalid && <span className="text-right my-2 text-xs text-error">제목은 최대 {MAX_PLAYLIST_TITLE_LENGTH}자까지 허용합니다.</span>}
                </div>

                <IconButton label="Confirm rename" onClick={commit}>
                  <Check className="w-4 h-4" />
                </IconButton>
                <IconButton label="Cancel rename" onClick={cancel}>
                  <X className="w-4 h-4" />
                </IconButton>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-primary leading-tight">{title}</h2>
                <div className="flex items-center gap-2">
                  <IconButton label="Edit title" onClick={start}>
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                  <IconButton label="Delete playlist" tone="danger" onClick={deleteConfirm.open}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </>
            )}
          </div>
          <p className="text-sm font-bold text-gray-500 mb-3">Created by Me</p>

          <div className="flex items-center space-x-2">
            <button
              className="flex-1 bg-primary text-white py-1.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 hover:bg-secondary border-2 border-transparent hover:border-black transition-all shadow-sm hover:shadow-md"
              onClick={handlePlayAll}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>재생</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmOverlay
        open={deleteConfirm.isOpen}
        title="플레이리스트를 삭제할까요?"
        onCancel={deleteConfirm.cancel}
        onConfirm={deleteConfirm.confirm}
      />
    </div>
  );
}
