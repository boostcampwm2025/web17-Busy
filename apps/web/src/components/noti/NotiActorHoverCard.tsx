'use client';

import type { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function NotiActorHoverCard({ userId, nickname, profileImgUrl }: { userId: string; nickname: string; profileImgUrl: string }) {
  const router = useRouter();

  const handleGoProfile = (event: MouseEvent) => {
    event.stopPropagation();
    router.push(`/profile/${userId}`);
  };

  return (
    <span className="relative inline-flex items-center font-semibold text-primary group">
      <span>{nickname}</span>
      <span
        className="absolute left-0 top-full z-10 mt-1 flex -translate-y-1 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100"
        onClick={handleGoProfile}
      >
        <span className="h-6 w-6 overflow-hidden rounded-full border border-gray-200">
          <img src={profileImgUrl} alt={nickname} className="h-full w-full object-cover" />
        </span>
        <span className="max-w-[120px] truncate">{nickname}</span>
      </span>
    </span>
  );
}
