'use client';

import type { Music, Post } from '@/types';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { usePostMedia } from '@/hooks';

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
    playBtn: 'w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-[2px_2px_0px_0px_#00ebc7]',
    infoBox: 'absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-primary shadow-[4px_4px_0px_0px_#FDE24F]',
    navBtn:
      'absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 border border-primary text-primary flex items-center justify-center hover:bg-white',
  },
  modal: {
    container: 'flex-1 bg-gray-4 relative group overflow-hidden',
    playBtn:
      'w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-[3px_3px_0px_0px_#00ebc7] hover:scale-105 transition-transform',
    infoBox: 'absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-xl border-2 border-primary shadow-[6px_6px_0px_0px_#FDE24F]',
    navBtn:
      'absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 border border-primary text-primary flex items-center justify-center hover:bg-white',
  },
};

export default function PostMedia({ post, variant, currentMusicId, isPlayingGlobal, onPlay, onClickContainer }: Props) {
  const { isMulti, activeMusic, coverUrl, isActivePlaying, prev, next } = usePostMedia({
    post,
    currentMusicId,
    isPlayingGlobal,
  });

  const styles = stylesByVariant[variant];

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

  return (
    <div className={styles.container} onClick={onClickContainer}>
      <img
        src={coverUrl}
        alt={activeMusic?.title ?? 'cover'}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/35 transition-colors">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={handlePlay} className={styles.playBtn} title={isActivePlaying ? '일시정지' : '재생'}>
            {isActivePlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
        </div>

        {isMulti ? (
          <>
            <button type="button" onClick={handlePrev} className={`${styles.navBtn} left-3`} title="이전">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button type="button" onClick={handleNext} className={`${styles.navBtn} right-3`} title="다음">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        ) : null}
      </div>

      {isMulti ? (
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border-2 border-primary text-xs font-black">
          {post.musics.length}곡
        </div>
      ) : null}

      {activeMusic ? (
        <div className={styles.infoBox}>
          <p className="font-black text-primary">{activeMusic.title}</p>
          <p className="text-xs font-bold text-gray-600">{activeMusic.artistName}</p>
        </div>
      ) : null}
    </div>
  );
}
