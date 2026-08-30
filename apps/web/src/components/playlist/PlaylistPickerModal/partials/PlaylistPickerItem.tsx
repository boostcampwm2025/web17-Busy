import type { PlaylistBriefResDto } from '@repo/dto';

import { DEFAULT_IMAGES } from '@/constants/defaultImages';
import { coalesceImageSrc } from '@/utils/image';

type Props = {
  playlist: PlaylistBriefResDto;
  busy: boolean;
  disabled: boolean;
  onSelect: (playlistId: string) => Promise<void>;
};

export function PlaylistPickerItem({ playlist, busy, disabled, onSelect }: Props) {
  return (
    <li>
      <button
        type="button"
        onClick={() => void onSelect(playlist.id)}
        disabled={disabled}
        className="w-full flex items-center justify-between p-3 hover:bg-grayish rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center min-w-0">
          <img
            src={coalesceImageSrc(playlist.firstAlbumCoverUrl, DEFAULT_IMAGES.ALBUM)}
            alt={playlist.title}
            loading="lazy"
            className="w-10 h-10 rounded-lg border border-gray-3 object-cover shrink-0"
          />
          <div className="ml-3 min-w-0 text-left">
            <p className="font-bold text-primary truncate">{playlist.title}</p>
            <p className="text-xs text-gray-2">{playlist.tracksCount}곡</p>
          </div>
        </div>

        <span className="text-xs font-black text-primary">{busy ? '저장 중…' : '선택'}</span>
      </button>
    </li>
  );
}
