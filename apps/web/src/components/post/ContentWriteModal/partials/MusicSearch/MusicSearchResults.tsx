import { Music as MusicIcon } from 'lucide-react';
import type { MusicResponseDto as Music } from '@repo/dto';

import TickerText from '@/components/common/TickerText';
import { ITUNES_SEARCH } from '@/constants/search';
import type { SearchStatus } from '@/types/search';

type Props = {
  status: SearchStatus;
  results: Music[];
  errorMessage?: string | null;
  isBelowMinLength: boolean;
  onAddMusic: (music: Music) => void;
};

const MIN_QUERY_HINT = `${ITUNES_SEARCH.MIN_QUERY_LENGTH}글자 이상 입력해주세요.`;

const Message = ({ text }: { text: string }) => <div className="p-4 text-center text-gray-2 text-sm">{text}</div>;

export default function MusicSearchResults({ status, results, errorMessage, isBelowMinLength, onAddMusic }: Props) {
  if (isBelowMinLength) return <Message text={MIN_QUERY_HINT} />;
  if (status === 'loading') return <Message text="검색 중..." />;
  if (status === 'error') return <Message text={errorMessage ?? '검색 중 오류가 발생했습니다.'} />;
  if (status === 'empty') return <Message text="검색 결과가 없습니다." />;

  return (
    <>
      <div className="px-4 py-2 flex items-center text-xs font-bold text-gray-1 uppercase tracking-wider bg-gray-4/50 border-b border-gray-3 mb-1">
        <MusicIcon className="w-3 h-3 mr-1" />
        검색 결과
      </div>

      {results.map((music) => (
        <button
          key={music.id}
          type="button"
          onClick={() => onAddMusic(music)}
          className="w-full flex items-center px-4 py-2 hover:bg-gray-4 transition-colors text-left group"
        >
          <img src={music.albumCoverUrl} alt="art" className="w-10 h-10 rounded object-cover mr-3 border border-gray-3" />
          <div className="min-w-0 flex-1">
            <TickerText text={music.title} className="font-bold text-sm text-primary group-hover:text-accent-cyan transition-colors" />
            <TickerText text={music.artistName} className="text-xs text-gray-1" />
          </div>
        </button>
      ))}
    </>
  );
}
