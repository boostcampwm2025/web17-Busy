import { PlaylistBriefItem } from '@/components/playlist';
import { PlaylistBriefResDto } from '@repo/dto';

export function LoadingMessage() {
  return <div className="p-4 text-center text-gray-2 text-sm">불러오는 중...</div>;
}

export function EmptyPlaylist({ onClick }: Readonly<{ onClick: () => Promise<void> }>) {
  return (
    <div className="p-4 text-center text-gray-2 text-sm">
      보관함이 비어있습니다.
      <div className="mt-2">
        <button type="button" onClick={onClick} className="text-xs font-bold underline text-gray-1">
          다시 시도
        </button>
      </div>
    </div>
  );
}

interface BriefItemListProps {
  briefs: PlaylistBriefResDto[];
  selectedPlaylistId: string | null;
  onSelect: (playlistId: string) => Promise<void>;
}

export function BriefItemList({ briefs, selectedPlaylistId, onSelect }: Readonly<BriefItemListProps>) {
  return (
    <div className="space-y-1">
      {briefs.map((pl) => (
        <PlaylistBriefItem key={pl.id} brief={pl} isLoading={selectedPlaylistId === pl.id} onSelect={onSelect} />
      ))}
    </div>
  );
}
