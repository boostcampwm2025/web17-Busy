'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import React, { memo } from 'react';
import { PlusCircle, FolderPlus } from 'lucide-react';

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
            <h3 className="text-lg font-black text-primary truncate">{currentMusic.title}</h3>
            <p className="text-xs font-bold text-gray-1 truncate">{currentMusic.artistName}</p>
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
            onClick={onPost}
            title="컨텐츠 작성"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-white font-bold text-xs opacity-50 cursor-not-allowed"
          >
            <PlusCircle className="w-4 h-4" />
            게시
          </button>

          <button
            type="button"
            onClick={onSave}
            title="보관함에 음악 추가"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-primary text-primary font-bold text-xs opacity-50 cursor-not-allowed"
          >
            <FolderPlus className="w-4 h-4" />
            저장
          </button>
        </div>
      )}
    </>
  );
}

export default memo(NowPlayingMetaActionsBase);
