'use client';

import { useRouter } from 'next/navigation';
import { NotiView } from './noti.types';

export default function NotiItem({ noti, onClick }: { noti: NotiView; onClick: (noti: NotiView) => void }) {
  const router = useRouter();

  const containerBase = 'relative flex gap-4 p-3 rounded-xl cursor-pointer transition-colors';

  // 읽음/안읽음 차이를 확실히
  const containerStyle = noti.isRead ? 'bg-gray-100/70 opacity-55 hover:opacity-100 hover:bg-gray-100' : 'bg-white hover:bg-grayish';

  const thumbShape = noti.thumbnailShape === 'circle' ? 'rounded-full' : 'rounded-md';

  const handleActorClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // ✅ 알림 클릭으로 전파 방지
    router.push(`/profile/${noti.actorUserId}`);
  };

  return (
    <div className={`${containerBase} ${containerStyle}`} onClick={() => onClick(noti)}>
      {/* unread 강조용 좌측 바 */}
      {!noti.isRead && <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-secondary" />}

      {/* ✅ 우측 unread 점: 더 크게 + ring + z-index */}
      {!noti.isRead && <div className="absolute top-4 right-4 z-20 w-3 h-3 bg-secondary rounded-full ring-2 ring-white" />}

      {/* 썸네일 */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12">
          <img
            src={noti.thumbnailUrl || `${process.env.NEXT_PUBLIC_DEFAULT_IMG}`}
            alt="noti"
            className={`w-full h-full object-cover border border-gray-200 ${thumbShape}`}
          />
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm text-primary leading-snug break-words">
          {/* ✅ 닉네임 hover tooltip */}
          <span className="relative inline-block">
            <span className="font-bold mr-1 hover:underline" onClick={handleActorClick} role="link">
              {noti.actorNickname}
            </span>

            {/* hover 영역 확보용 */}
            <span className="absolute left-0 top-0 -inset-1" />

            {/* 툴팁: 닉네임 위에 마우스 올리면 표시 */}
            <span className="group relative">
              {/* 툴팁 박스 */}
              <span
                className="
                  pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto
                  absolute left-0 top-6 z-30 w-56
                  rounded-xl border border-gray-200 bg-white shadow-lg
                  p-3 transition-opacity
                "
                onClick={(e) => e.stopPropagation()}
              >
                <button type="button" className="w-full flex items-center gap-3 text-left" onClick={handleActorClick}>
                  <img
                    src={noti.actorProfileImgUrl || `${process.env.NEXT_PUBLIC_DEFAULT_IMG}`}
                    alt={noti.actorNickname}
                    className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-primary truncate">{noti.actorNickname}</div>
                    <div className="text-[11px] font-bold text-gray-400 mt-0.5">프로필 보기</div>
                  </div>
                </button>
              </span>

              {/* hover를 “닉네임”에만 걸기 위한 트리거 영역 */}
              <span className="absolute inset-0" />
            </span>
          </span>

          {noti.messageBody}
        </p>

        <p className="text-[10px] text-gray-400 font-bold mt-1.5">{noti.createdAtText}</p>
      </div>
    </div>
  );
}
