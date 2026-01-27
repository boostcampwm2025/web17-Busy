'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { LikedUserDto } from '@repo/dto';

import { DEFAULT_IMAGES } from '@/constants';
import { coalesceImageSrc } from '@/utils';
import { LoadingSpinner } from '@/components';

type Props = {
  isOpen: boolean;
  onClose: () => void;

  users: LikedUserDto[];
  isLoading: boolean;
  errorMsg: string | null;
  onRetry: () => void;
};

export default function LikedUsersOverlay({ isOpen, onClose, users, isLoading, errorMsg, onRetry }: Props) {
  const router = useRouter();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md rounded-3xl border-2 border-primary flex flex-col max-h-[60vh] overflow-hidden animate-scale-up z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white">
          <h2 className="text-xl font-black text-primary">좋아요</h2>
          <button onClick={onClose} className="p-1 hover:bg-grayish rounded-full transition-colors">
            <X className="w-6 h-6 text-primary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="py-6">
              <LoadingSpinner />
            </div>
          ) : errorMsg ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
              <p className="font-bold text-sm">{errorMsg}</p>
              <button type="button" onClick={onRetry} className="mt-3 text-xs font-bold underline text-gray-600">
                다시 시도
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 py-10">
              <p className="font-bold text-sm">좋아요한 사용자가 없습니다.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {users.map((u) => (
                <li key={u.id} className="flex items-center p-3 hover:bg-grayish rounded-xl transition-colors">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/profile/${u.id}`);
                    }}
                    className="relative shrink-0 w-10 h-10"
                  >
                    <img
                      src={coalesceImageSrc(u.profileImgUrl, DEFAULT_IMAGES.PROFILE)}
                      alt={u.nickname}
                      className="w-full h-full rounded-full border border-primary object-cover"
                    />
                  </button>
                  <p className="ml-3 min-w-0 font-bold text-md text-primary truncate">{u.nickname}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
