'use client';

import { useState } from 'react';

import { MAX_PLAYLIST_TITLE_LENGTH } from '@/constants/playlist';

type Options = {
  title: string;
  /** 실제로 이름이 바뀔 때만 호출된다. 어떤 mutation을 쓸지는 호출부가 정한다. */
  onRename: (nextTitle: string) => void;
};

/**
 * 제목 인라인 편집. 편집 중인 draft는 화면에만 사는 값이라 여기서 들고 있고,
 * 커밋된 제목은 mutation이 갱신한 cache를 통해 title로 되돌아온다.
 */
export const usePlaylistTitleEditing = ({ title, onRename }: Options) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  // draft에서 매번 계산한다. state + effect로 두면 draft가 바뀐 뒤 한 렌더 동안 어긋난다.
  const isInvalid = draft.trim().length > MAX_PLAYLIST_TITLE_LENGTH;

  const start = () => {
    setDraft(title);
    setIsEditing(true);
  };

  const commit = () => {
    if (isInvalid) return;

    setIsEditing(false);

    const nextTitle = draft.trim();
    if (!nextTitle || nextTitle === title) {
      setDraft(title);
      return;
    }

    onRename(nextTitle);
  };

  const cancel = () => {
    setDraft(title);
    setIsEditing(false);
  };

  return { isEditing, draft, isInvalid, start, change: setDraft, commit, cancel };
};
