import { NotiView } from './noti.types';

export default function NotiItem({ noti, onClick }: { noti: NotiView; onClick: (id: string) => void }) {
  const base = 'flex flex-col p-3 rounded-xl transition-colors cursor-pointer group relative';

  // ✅ 여기서 “읽음이면 흐리게” 처리
  // - opacity 유틸: opacity-60 (Tailwind 공식) :contentReference[oaicite:2]{index=2}
  // - 배경 유틸: bg-gray-50 / hover:bg-grayish (Tailwind bg 유틸) :contentReference[oaicite:3]{index=3}
  const readStyle = noti.isRead ? 'bg-gray-50 opacity-60 hover:opacity-100' : 'hover:bg-grayish';

  return (
    <div className={`${base} ${readStyle}`} onClick={() => onClick(noti.id)} role="button" tabIndex={0}>
      <div className="flex items-start">
        {!noti.isRead && <div className="absolute top-5 right-3 w-2 h-2 bg-secondary rounded-full" />}

        <div className="relative mr-4 flex-shrink-0">
          <div className="w-12 h-12">
            <img
              src={noti.avatarUrl ?? noti.targetImgUrl ?? '/images/default-avatar.png'}
              alt="noti"
              className="w-full h-full object-cover border border-gray-200 rounded-full"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm text-primary leading-snug">{noti.message}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1.5">{noti.createdAtText}</p>
        </div>
      </div>
    </div>
  );
}
