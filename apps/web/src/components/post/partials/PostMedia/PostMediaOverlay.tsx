import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

type Props = {
  styles: { playBtn: string; navBtn: string };

  isCoverPage: boolean;
  isMulti: boolean;
  isActivePlaying: boolean;
  hasActiveMusic: boolean;
  hasMusics: boolean;
  canPlayAll: boolean;

  isAtStart: boolean;
  isAtEnd: boolean;

  onPlay: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onPlayAll: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onPrev: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onNext: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

/** 이미지 위에 겹치는 재생 버튼과 좌우 이동 버튼. */
export default function PostMediaOverlay({
  styles,
  isCoverPage,
  isMulti,
  isActivePlaying,
  hasActiveMusic,
  hasMusics,
  canPlayAll,
  isAtStart,
  isAtEnd,
  onPlay,
  onPlayAll,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/35 transition-colors">
      {isCoverPage && hasMusics && canPlayAll && (
        <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={onPlayAll} className={styles.playBtn} title="전체 재생">
            <Play className="w-6 h-6 ml-0.5" />
          </button>
        </div>
      )}

      {!isCoverPage && hasActiveMusic && (
        <div className="absolute inset-0 flex items-center justify-center opacity-100 md:group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={onPlay} className={styles.playBtn} title={isActivePlaying ? '일시정지' : '재생'}>
            {isActivePlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
        </div>
      )}

      {isMulti && (
        <>
          {!isAtStart && (
            <button type="button" onClick={onPrev} className={`${styles.navBtn} left-3`} title="이전">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {!isAtEnd && (
            <button type="button" onClick={onNext} className={`${styles.navBtn} right-3`} title="다음">
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
