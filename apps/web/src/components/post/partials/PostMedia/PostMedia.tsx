import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { usePostMedia } from '@/hooks/post/use-post-media';
import { usePostMediaSwipe } from '@/hooks/post/use-post-media-swipe';

import PostMediaInfoBox from './PostMediaInfoBox';
import PostMediaOverlay from './PostMediaOverlay';
import SlideImage from './SlideImage';
import { stylesByVariant } from './post-media-styles';
import type { Variant } from './types';

type Props = {
  post: Post;
  variant: Variant;

  currentMusicId: string | null;
  isPlayingGlobal: boolean;

  onPlay: (music: Music) => void;
  /** 커버 페이지 재생 버튼: 게시글 전체 음악 재생 */
  onPlayAll?: () => void;

  /** 카드에서만: 컨테이너 클릭 시 상세 열기 */
  onClickContainer?: () => void;
};

export default function PostMedia({ post, variant, currentMusicId, isPlayingGlobal, onPlay, onPlayAll, onClickContainer }: Props) {
  const { isMulti, activeMusic, coverUrl, isActivePlaying, prev, next, activeIndex, totalLength } = usePostMedia({
    post,
    currentMusicId,
    isPlayingGlobal,
  });

  const { containerRef, trackStyle, handleContainerClick, handleTouchStart, handleTouchMove, handleTouchEnd } = usePostMediaSwipe({
    isMulti,
    activeIndex,
    totalLength,
    onPrev: prev,
    onNext: next,
    onClickContainer,
  });

  const styles = stylesByVariant[variant];
  const isCoverPage = activeIndex === 0;
  const isAtStart = activeIndex <= 0;
  const isAtEnd = activeIndex >= totalLength - 1;

  // 인접 슬라이드 이미지 URL
  const getSlideUrl = (index: number) => {
    const i = ((index % totalLength) + totalLength) % totalLength;
    if (i === 0) return post.coverImgUrl || '';
    return post.musics[i - 1]?.albumCoverUrl || post.coverImgUrl || '';
  };
  const prevUrl = isMulti && !isAtStart ? getSlideUrl(activeIndex - 1) : '';
  const nextUrl = isMulti && !isAtEnd ? getSlideUrl(activeIndex + 1) : '';

  const handlePlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!activeMusic) return;
    onPlay(activeMusic);
  };

  const handlePlayAll = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onPlayAll?.();
  };

  const handlePrev = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    prev();
  };

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    next();
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      data-swipe-carousel
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isMulti ? (
        // [이전, 현재, 다음] 3장을 나란히 두고 트랙을 움직인다.
        <div className="flex h-full w-[300%]" style={trackStyle}>
          <div className="w-1/3 h-full flex-shrink-0 relative overflow-hidden">
            {prevUrl && <SlideImage src={prevUrl} alt="이전" variant={variant} />}
          </div>
          <div className="w-1/3 h-full flex-shrink-0 relative overflow-hidden">
            <SlideImage src={coverUrl} alt={activeMusic?.title ?? 'cover'} variant={variant} isActive />
          </div>
          <div className="w-1/3 h-full flex-shrink-0 relative overflow-hidden">
            {nextUrl && <SlideImage src={nextUrl} alt="다음" variant={variant} />}
          </div>
        </div>
      ) : (
        <SlideImage src={coverUrl} alt={activeMusic?.title ?? 'cover'} variant={variant} isActive />
      )}

      <PostMediaOverlay
        styles={styles}
        isCoverPage={isCoverPage}
        isMulti={isMulti}
        isActivePlaying={isActivePlaying}
        hasActiveMusic={Boolean(activeMusic)}
        hasMusics={post.musics.length > 0}
        canPlayAll={Boolean(onPlayAll)}
        isAtStart={isAtStart}
        isAtEnd={isAtEnd}
        onPlay={handlePlay}
        onPlayAll={handlePlayAll}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {isMulti && (
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border-2 border-primary text-xs font-black">
          {post.musics.length}곡
        </div>
      )}

      <PostMediaInfoBox
        className={styles.infoBox}
        isCoverPage={isCoverPage}
        musicCount={post.musics.length}
        canPlayAll={Boolean(onPlayAll)}
        activeMusic={activeMusic}
      />
    </div>
  );
}
