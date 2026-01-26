'use client';

import { MoreHorizontal } from 'lucide-react';

type Props = {
  profileImg: string;
  nickname: string;
};

export default function PostDetailHeader({ profileImg, nickname }: Props) {
  return (
    <div className="p-4 border-b-2 border-primary/10 flex items-center justify-between">
      <div className="flex items-center space-x-3 min-w-0">
        <img src={profileImg} alt={nickname} className="w-9 h-9 rounded-full border border-primary object-cover" />
        <span className="font-bold text-primary truncate">{nickname}</span>
      </div>
      <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer hover:text-primary" />
    </div>
  );
}
