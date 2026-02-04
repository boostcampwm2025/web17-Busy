import { Check, Pencil, Play, Search, Trash2, X } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

type Props = {
  title: string;
  tracksCount: number;
  coverImgUrl: string;
  onPlayTotalSongs: () => void;
  isEditingTitle: boolean;
  draftTitle: string;
  onStartRename: () => void;
  onChangeTitle: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
};

export function Header({
  title,
  tracksCount,
  coverImgUrl,
  onPlayTotalSongs,
  isEditingTitle,
  draftTitle,
  onStartRename,
  onChangeTitle,
  onCommitRename,
  onCancelRename,
  onDelete,
}: Props) {
  return (
    <div className="relative bg-grayish border-b-2 border-primary p-6">
      <div className="flex items-center space-x-6">
        {/* Cover */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <div className="absolute inset-0 bg-primary translate-x-1 translate-y-1 rounded-xl"></div>
          <img src={coverImgUrl} alt={title} className="relative w-full h-full object-cover rounded-xl border-2 border-primary z-10" />
          <div className="absolute -bottom-2 -right-2 z-20 bg-accent-pink text-white text-xs font-bold px-2 py-0.5 rounded-full border border-primary">
            {tracksCount}곡
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  autoFocus
                  className="w-full text-2xl font-black text-primary rounded-md border-2 border-primary px-2 py-1 focus:outline-none"
                  value={draftTitle}
                  onChange={(e) => onChangeTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onCommitRename();
                    }
                    if (e.key === 'Escape') {
                      onCancelRename();
                    }
                  }}
                />
                <button
                  type="button"
                  className="p-1 rounded-md border-2 border-primary text-primary hover:bg-gray-50"
                  onClick={onCommitRename}
                  aria-label="Confirm rename"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1 rounded-md border-2 border-primary text-primary hover:bg-gray-50"
                  onClick={onCancelRename}
                  aria-label="Cancel rename"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-primary leading-tight">{title}</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 rounded-md border-2 border-primary text-primary hover:bg-gray-50"
                    onClick={onStartRename}
                    aria-label="Edit title"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded-md border-2 border-primary text-[var(--color-accent-pink)] hover:bg-gray-50"
                    onClick={onDelete}
                    aria-label="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
          <p className="text-sm font-bold text-gray-500 mb-3">Created by Me</p>

          <div className="flex items-center space-x-2">
            <button
              className="flex-1 bg-primary text-white py-1.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 hover:bg-secondary border-2 border-transparent hover:border-black transition-all shadow-sm hover:shadow-md"
              onClick={() => tracksCount > 0 && onPlayTotalSongs()}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>재생</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
