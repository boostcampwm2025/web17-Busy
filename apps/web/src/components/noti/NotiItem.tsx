import { NotiView } from './noti.types';

export default function NotiItem({ noti, onClick }: { noti: NotiView; onClick: (id: NotiView) => void }) {
  const base = 'flex flex-col p-3 rounded-xl transition-colors cursor-pointer group relative';
  const readStyle = noti.isRead ? 'bg-gray-50 opacity-60 hover:opacity-100' : 'hover:bg-grayish';
  return (
    <div className={`${base} ${readStyle}`} onClick={() => onClick(noti)}>
      <div className="flex items-start">
        {!noti.isRead && <div className="absolute top-5 right-3 w-2 h-2 bg-secondary rounded-full" />}

        <div className="relative mr-4 flex-shrink-0">
          <div className="w-12 h-12">
            <img
              src={noti.thumbnailUrl ?? '/images/default-avatar.png'}
              alt="noti"
              className="w-full h-full object-cover border border-gray-200 rounded-full"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm text-primary leading-snug">{noti.messageBody}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1.5">{noti.createdAtText}</p>
        </div>
      </div>
    </div>
  );
}
