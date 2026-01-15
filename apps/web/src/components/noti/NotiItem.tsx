// NotiItem.tsx
import { NotiView } from './noti.types';

export default function NotiItem({ noti, onClick }: { noti: NotiView; onClick: (noti: NotiView) => void }) {
  const containerBase = 'relative flex gap-4 p-3 rounded-xl cursor-pointer transition-colors';

  // 읽음/안읽음 차이를 확실히:
  // - unread: 살짝 강조 배경 + 좌측 바 + 우측 점
  // - read: 흐린 배경 + opacity 낮춤
  const containerStyle = noti.isRead ? 'bg-gray-50/60 opacity-70 hover:opacity-100 hover:bg-gray-50' : 'bg-white hover:bg-grayish';

  const thumbShape = noti.thumbnailShape === 'circle' ? 'rounded-full' : 'rounded-md';

  return (
    <div className={`${containerBase} ${containerStyle}`} onClick={() => onClick(noti)}>
      {/* unread 강조용 좌측 바 */}
      {!noti.isRead && <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-secondary" />}

      {/* 우측 unread 점 */}
      {!noti.isRead && <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-secondary rounded-full" />}

      {/* 썸네일 */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12">
          <img
            src={noti.thumbnailUrl ?? '/images/default-avatar.png'}
            alt="noti"
            className={`w-full h-full object-cover border border-gray-200 ${thumbShape}`}
          />
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm text-primary leading-snug break-words">
          <span className="font-bold mr-1">{noti.actorNickname}</span>
          {noti.messageBody}
        </p>

        <p className="text-[10px] text-gray-400 font-bold mt-1.5">{noti.createdAtText}</p>
      </div>
    </div>
  );
}
