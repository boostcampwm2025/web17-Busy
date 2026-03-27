'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { usePostMedia } from '@/hooks';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';
import TickerText from '@/components/TickerText';

type Variant = 'card' | 'modal';

type Props = {
  post: Post;
  variant: Variant;

  currentMusicId: string | null;
  isPlayingGlobal: boolean;

  onPlay: (music: Music) => void;

  /** 카드에서만: 컨테이너 클릭 시 상세 열기 */
  onClickContainer?: () => void;
};

const stylesByVariant: Record<Variant, { container: string; playBtn: string; infoBox: string; navBtn: string }> = {
  card: {
    container: 'relative group w-full aspect-square md:aspect-video rounded-xl overflow-hidden border-2 border-primary mb-4 bg-gray-100',
    playBtn: 'w-12 aspect-square rounded-full bg-primary text-white flex items-center justify-center shadow-[2px_2px_0px_0px_#00ebc7]',
    infoBox:
      'absolute max-w-4/5 bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-primary shadow-[4px_4px_0px_0px_#FDE24F]',
    navBtn:
      'absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 border border-primary text-primary flex items-center justify-center hover:bg-white transition-opacity ' +
      'lg:opacity-0 lg:group-hover:opacity-100 lg:pointer-events-none lg:group-hover:pointer-events-auto',
  },
  modal: {
    container: 'w-full aspect-[7/4] md:aspect-[7/3] md:flex-1 bg-gray-4 relative group overflow-hidden',
    playBtn:
      'w-10 md:w-12 aspect-square rounded-full bg-primary text-white flex items-center justify-center shadow-[3px_3px_0px_0px_#00ebc7] hover:scale-105 transition-transform',
    infoBox:
      'absolute max-w-4/5 bottom-3 left-3 md:bottom-6 md:left-6 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 sm:px-5 sm:py-3 rounded-xl border-2 border-primary shadow-[3px_3px_0px_0px_#FDE24F] md:shadow-[6px_6px_0px_0px_#FDE24F]',
    navBtn:
      'absolute top-1/2 -translate-y-1/2 w-8 md:w-12 aspect-square rounded-full bg-white/80 border border-primary text-primary flex items-center justify-center hover:bg-white transition-opacity ' +
      'lg:opacity-0 lg:group-hover:opacity-100 lg:pointer-events-none lg:group-hover:pointer-events-auto',
  },
};

export default function PostMedia({ post, variant, currentMusicId, isPlayingGlobal, onPlay, onClickContainer }: Props) {
  const { isMulti, activeMusic, coverUrl, isActivePlaying, prev, next, activeIndex, totalLength } = usePostMedia({
    post,
    currentMusicId,
    isPlayingGlobal,
  });

  const styles = stylesByVariant[variant];

  // 스와이프 캐러셀 상태
  const [dragOffset, setDragOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasSwipeRef = useRef(false); // 스와이프였으면 click 방지

  // 인접 슬라이드 이미지 URL
  const getSlideUrl = (index: number) => {
    const i = ((index % totalLength) + totalLength) % totalLength;
    if (i === 0) return post.coverImgUrl || '';
    return post.musics[i - 1]?.albumCoverUrl || post.coverImgUrl || '';
  };
  const prevUrl = isMulti ? getSlideUrl(activeIndex - 1) : '';
  const nextUrl = isMulti ? getSlideUrl(activeIndex + 1) : '';

  const handlePlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!activeMusic) return;
    onPlay(activeMusic);
  };

  const handlePrev = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    prev();
  };

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    next();
  };

  const handleContainerClick = () => {
    if (wasSwipeRef.current) return;
    onClickContainer?.();
  };

  // 터치 스와이프
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMulti || transitioning) return;
    touchStartX.current = e.touches[0]?.clientX ?? 0;
    wasSwipeRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMulti || transitioning) return;
    const delta = (e.touches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) > 5) wasSwipeRef.current = true;
    setDragOffset(delta);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMulti) return;
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    const containerWidth = containerRef.current?.offsetWidth ?? 300;
    const threshold = containerWidth * 0.3;

    // 짧은 탭은 스와이프 처리 안 함
    if (Math.abs(delta) < 5) {
      setDragOffset(0);
      return;
    }

    setTransitioning(true);

    if (delta < -threshold) {
      // 왼쪽 스와이프 → 다음
      setDragOffset(-containerWidth);
      setTimeout(() => {
        next();
        setTransitioning(false);
        setDragOffset(0);
      }, 250);
    } else if (delta > threshold) {
      // 오른쪽 스와이프 → 이전
      setDragOffset(containerWidth);
      setTimeout(() => {
        prev();
        setTransitioning(false);
        setDragOffset(0);
      }, 250);
    } else {
      // 임계값 미달 → 제자리 복귀
      setDragOffset(0);
      setTimeout(() => setTransitioning(false), 250);
    }
  };

  const isCoverPage = activeIndex === 0;

  // 트랙 스타일: [이전, 현재, 다음]을 나란히, translateX로 현재 이미지를 중앙에 표시
  const trackStyle: React.CSSProperties = {
    transform: `translateX(calc(-33.333% + ${dragOffset}px))`,
    transition: transitioning ? 'transform 0.25s ease-out' : 'none',
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 이미지 슬라이드 트랙 */}
      {isMulti ? (
        <div className="flex h-full w-[300%]" style={trackStyle}>
          <div className="w-1/3 h-full flex-shrink-0">
            <img src={prevUrl} alt="이전" className="w-full h-full object-cover" />
          </div>
          <div className="w-1/3 h-full flex-shrink-0">
            <img
              src={coverUrl}
              alt={activeMusic?.title ?? 'cover'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="w-1/3 h-full flex-shrink-0">
            <img src={nextUrl} alt="다음" className="w-full h-full object-cover" />
          </div>
        </div>
      ) : (
        <img
          src={coverUrl}
          alt={activeMusic?.title ?? 'cover'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      {/* 오버레이 (버튼, 배지, 음악 정보) */}
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/35 transition-colors">
        {!isCoverPage && activeMusic && (
          <div className="absolute inset-0 flex items-center justify-center opacity-100 md:group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={handlePlay} className={styles.playBtn} title={isActivePlaying ? '일시정지' : '재생'}>
              {isActivePlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
          </div>
        )}
        {isMulti && (
          <>
            <button type="button" onClick={handlePrev} className={`${styles.navBtn} left-3`} title="이전">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button type="button" onClick={handleNext} className={`${styles.navBtn} right-3`} title="다음">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {isMulti && (
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border-2 border-primary text-xs font-black">
          {post.musics.length}곡
        </div>
      )}

      {activeMusic && (
        <div className={`${styles.infoBox} max-w-[70%] md:max-w-[60%] min-w-0`}>
          <TickerText text={activeMusic.title} className="text-sm md:text-base font-black text-primary" />
          <TickerText text={activeMusic.artistName} className="text-xs font-bold text-gray-600" />
        </div>
      )}
    </div>
  );
}
