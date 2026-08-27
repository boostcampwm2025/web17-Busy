import type { MusicResponseDto as Music } from '@repo/dto';

import TickerText from '@/components/common/TickerText';

type Props = {
  className: string;
  isCoverPage: boolean;
  musicCount: number;
  canPlayAll: boolean;
  activeMusic: Music | null;
};

/** 왼쪽 아래에 뜨는 곡 정보. 커버 페이지에서는 "전체 재생"으로 바뀐다. */
export default function PostMediaInfoBox({ className, isCoverPage, musicCount, canPlayAll, activeMusic }: Props) {
  if (isCoverPage && musicCount > 0 && canPlayAll) {
    return (
      <div className={`${className} min-w-0`}>
        <span className="text-sm md:text-base font-black text-primary">전체 재생</span>
        <p className="text-xs font-bold text-gray-600">{musicCount}곡</p>
      </div>
    );
  }

  if (!activeMusic) return null;

  return (
    <div className={`${className} max-w-[70%] md:max-w-[60%] min-w-0`}>
      <TickerText text={activeMusic.title} className="text-sm md:text-base font-black text-primary" />
      <TickerText text={activeMusic.artistName} className="text-xs font-bold text-gray-600" />
    </div>
  );
}
