'use client';

import React from 'react';
import NotiActorHoverCard from './NotiActorHoverCard';
import { NotiView } from './noti.types';
import { DEFAULT_IMAGES } from '@/constants';
import { coalesceImageSrc } from '@/utils';

function NotiItem({ noti, onClick }: { noti: NotiView; onClick: (noti: NotiView) => void }) {
  const containerBase = 'relative flex justify-between items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors';

  // 읽음/안읽음 차이를 확실히
  const containerStyle = noti.isRead ? 'bg-gray-100/70 opacity-55 hover:opacity-100 hover:bg-gray-100' : 'bg-white hover:bg-gray-100';

  const thumbShape = noti.thumbnailShape === 'circle' ? 'rounded-full' : 'rounded-md';

  return (
    <div className={`${containerBase} ${containerStyle}`} onClick={() => onClick(noti)}>
      {/* unread 강조용 좌측 바 */}
      {!noti.isRead && <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-accent-cyan" />}

      {/* 썸네일 */}
      <div className="relative shrink-0">
        <div className="w-12 h-12">
          <img
            src={coalesceImageSrc(noti.thumbnailUrl, DEFAULT_IMAGES.ALBUM)}
            alt="noti"
            className={`w-full h-full object-cover border border-gray-200 ${thumbShape}`}
          />
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm text-primary leading-snug break-words">
          <NotiActorHoverCard nickname={noti.actorNickname} profileImgUrl={noti.actorProfileImgUrl} userId={noti.actorUserId} /> {noti.messageBody}
        </p>

        <p className="text-[10px] text-gray-400 font-bold mt-1.5">{noti.createdAtText}</p>
      </div>

      {/* 우측 unread 점 */}
      {!noti.isRead && <div className="top-4 right-4 w-3 h-3 bg-accent-cyan rounded-full" />}
    </div>
  );
}

export default React.memo(
  NotiItem,
  (prev: { noti: NotiView; onClick: (noti: NotiView) => void }, next: { noti: NotiView; onClick: (noti: NotiView) => void }) => {
    return (
      prev.noti.id === next.noti.id &&
      prev.noti.isRead === next.noti.isRead &&
      prev.noti.actorNickname === next.noti.actorNickname &&
      prev.noti.actorProfileImgUrl === next.noti.actorProfileImgUrl
    );
  },
);
