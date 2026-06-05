'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import React, { memo } from 'react';
import { Box, Plus } from 'lucide-react';
import { TickerText } from '@/components';

type Props = {
  currentMusic: Music | null;
  playError: string | null;

  onPost: () => void;
  onSave: () => void;
};

function NowPlayingMetaActionsBase({ currentMusic, playError, onPost, onSave }: Props) {
  const enabled = Boolean(currentMusic);

  return (
    <>
      <div className="text-center mb-2">
        {currentMusic ? (
          <>
            <TickerText text={currentMusic.title} className="text-lg font-black text-primary" />
            <TickerText text={currentMusic.artistName} className="text-xs font-bold text-gray-1" />
          </>
        ) : (
          <>
            <p className="font-bold text-gray-1">재생 중인 음악이 없습니다.</p>
            <p className="text-sm text-gray-2 mt-1">피드/검색에서 음악을 선택해보세요.</p>
          </>
        )}
      </div>

      {enabled && playError ? (
        <div className="mb-3 rounded-xl border-2 border-secondary bg-secondary/10 px-3 py-2 text-sm font-bold text-secondary">{playError}</div>
      ) : null}

      {enabled && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            type="button"
            onClick={onSave}
            title="보관함에 추가"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-primary text-primary font-bold text-xs cursor-pointer transition-all hover:shadow-[2px_2px_0px_0px_#00ebc7]"
          >
            <Box className="w-4 h-4" />
            저장
          </button>

          <button
            type="button"
            onClick={onPost}
            title="추천 글 작성"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-primary bg-accent-pink text-white font-bold text-xs cursor-pointer transition-all hover:shadow-[2px_2px_0px_0px_#00ebc7]"
          >
            <Plus className="w-4 h-4" />
            게시
          </button>
        </div>
      )}
    </>
  );
}

export default memo(NowPlayingMetaActionsBase);
