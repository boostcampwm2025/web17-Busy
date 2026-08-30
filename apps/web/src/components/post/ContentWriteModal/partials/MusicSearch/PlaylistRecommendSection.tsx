import { Sparkles } from 'lucide-react';

import type { ListStatus, PlaylistBrief } from '@/hooks/playlist/use-playlist-recommendations';

import { BriefItemList, EmptyPlaylist, LoadingMessage } from './PlaylistSectionInner';

type Props = {
  status: ListStatus;
  briefs: PlaylistBrief[];
  errorMessage?: string | null;
  selectedPlaylistId: string | null;
  onRetry: () => void;
  onSelect: (playlistId: string) => void;
};

/** 검색어가 없을 때 드롭다운에 뜨는 "내 플레이리스트" 추천. */
export default function PlaylistRecommendSection({ status, briefs, errorMessage, selectedPlaylistId, onRetry, onSelect }: Props) {
  const renderContent = () => {
    if (status === 'loading') return <LoadingMessage />;
    if (briefs.length === 0) return <EmptyPlaylist onClick={onRetry} />;
    return <BriefItemList briefs={briefs} selectedPlaylistId={selectedPlaylistId} onSelect={onSelect} />;
  };

  return (
    <>
      <div className="px-4 py-2 flex items-center text-xs font-bold text-accent-cyan uppercase tracking-wider bg-gray-4/50 border-b border-gray-3 mb-1">
        <Sparkles className="w-3 h-3 mr-1" />
        추천 (내 플레이리스트)
      </div>
      {renderContent()}
      {errorMessage ? <div className="px-4 py-2 text-[11px] text-gray-2">{errorMessage}</div> : null}
    </>
  );
}
