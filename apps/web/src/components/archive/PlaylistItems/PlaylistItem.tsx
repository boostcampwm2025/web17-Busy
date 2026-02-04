import ConfirmOverlay from '@/components/ConfirmOverlay';
import { DEFAULT_IMAGES } from '@/constants';
import { MODAL_TYPES, useModalStore } from '@/stores';
import type { PlaylistBriefResDto as Playlist } from '@repo/dto';
import { Library, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = Playlist & {
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function PlaylistItem(playlist: Props) {
  const openModal = useModalStore((s) => s.openModal);
  const isMenuOpen = playlist.openMenuId === playlist.id;

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(playlist.title);

  // 플리 상세 모달 열기
  const handlePlaylistClick = () => {
    if (isEditingTitle) return;
    openModal(MODAL_TYPES.PLAYLIST_DETAIL, { playlistId: playlist.id });
  };

  const toggleMenu: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    if (isMenuOpen) {
      playlist.setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, left: rect.right, width: rect.width });
    playlist.setOpenMenuId(playlist.id);
  };

  const onRename: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    playlist.setOpenMenuId(null);

    setDraftTitle(playlist.title);
    setIsEditingTitle(true);
  };

  const onDelete: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    playlist.setOpenMenuId(null);

    setConfirmOpen(true);
  };

  const commitRename = async () => {
    const nextTitle = draftTitle.trim();
    if (!nextTitle || nextTitle === playlist.title) {
      setIsEditingTitle(false);
      setDraftTitle(playlist.title);
      return;
    }
    await playlist.onRename(playlist.id, nextTitle);
    setIsEditingTitle(false);
  };

  const cancelRename = () => {
    setIsEditingTitle(false);
    setDraftTitle(playlist.title);
  };

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!isMenuOpen) return;
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      playlist.setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isMenuOpen, playlist]);

  const menu = useMemo(() => {
    if (!isMenuOpen || !menuPos) return;
    return (
      <div
        ref={menuRef}
        className="fixed z-9999 w-36 px-1 py-2 bg-white border-2 border-primary rounded-lg shadow-[4px_4px_0px_0px_#00214D] overflow-hidden"
        style={{ top: menuPos.top, left: menuPos.left - 144 }} // menu width: 144px
        onClick={(e) => e.stopPropagation()}
      >
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-primary hover:bg-gray-50" onClick={onRename}>
          <Pencil className="w-4 h-4" />
          이름 변경
        </button>
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-accent-pink hover:bg-[color-mix(in_srgb,var(--color-accent-pink),white_90%)]"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
          삭제
        </button>
      </div>
    );
  }, [isMenuOpen, menuPos]);

  return (
    <div
      onClick={handlePlaylistClick}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 bg-white border-2 border-primary rounded-xl p-4 cursor-pointer hover:bg-gray-50 hover:shadow-[6px_6px_0px_0px_#00EBC7] hover:-translate-y-1 transition-all duration-200"
    >
      {/* 플리 첫 곡 앨범 커버 이미지 부분 */}
      <div className="relative w-12 md:w-16 aspect-square shrink-0">
        <div className="absolute top-0 right-0 w-full h-full bg-primary/20 rounded-lg transform rotate-6 border border-primary/20 transition-transform group-hover:rotate-12"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-white rounded-lg border border-primary/20 transform rotate-3"></div>
        <img
          src={playlist.firstAlbumCoverUrl || DEFAULT_IMAGES.ALBUM}
          alt={playlist.title}
          className="relative w-full h-full object-cover rounded-lg border-2 border-primary z-10"
        />
      </div>

      {/* 플리 정보 */}
      <div className="min-w-0 overflow-hidden">
        {isEditingTitle ? (
          <input
            autoFocus
            className="w-full sm:text-lg font-black text-primary rounded-md border-2 border-primary px-2 py-1 focus:outline-none"
            value={draftTitle}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitRename();
              }
              if (e.key === 'Escape') {
                cancelRename();
              }
            }}
          />
        ) : (
          <h3 className="max-w-full sm:text-lg font-black text-primary truncate group-hover:text-accent-pink transition-colors">{playlist.title}</h3>
        )}
        <p className="text-xs sm:text-sm font-bold text-gray-400 mt-1 flex items-center shrink-0">
          <Library className="w-4 h-4 mr-1" />
          {playlist.tracksCount}곡 저장됨
        </p>
      </div>

      {/* 더보기 메뉴 */}
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="p-2 rounded-lg border-none text-gray-500 hover:text-primary hover:border-primary transition-colors shrink-0"
        aria-label="Playlist actions"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {typeof window !== 'undefined' && menu && createPortal(menu, document.body)}

      <ConfirmOverlay
        open={confirmOpen}
        title="플레이리스트를 삭제할까요?"
        confirmLabel="삭제"
        cancelLabel="취소"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await playlist.onDelete(playlist.id);
        }}
      />
    </div>
  );
}
