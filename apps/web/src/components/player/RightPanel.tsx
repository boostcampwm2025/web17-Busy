import { X } from 'lucide-react';

import QueueList from './QueueList/QueueList';
import MiniPlayerBar from './MiniPlayerBar';
import NowPlaying from './NowPlaying/NowPlaying';
import { useQueueSync } from '@/hooks/queue/useQueueSync';
import { useGuestQueueSession } from '@/hooks/queue/useGuestQueueSession';
import { useFullPlayer } from '@/hooks/player/use-full-player';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';

export default function RightPanel() {
  const { isAuthenticated, isLoading } = useAuthMe();

  useQueueSync({ enabled: isAuthenticated && !isLoading });
  useGuestQueueSession(!isAuthenticated && !isLoading);

  const fullPlayer = useFullPlayer();

  const section = (
    <section
      className={
        fullPlayer.isOpen
          ? 'lg:hidden flex flex-col bg-white fixed inset-0 z-[10001] animate-slide-up'
          : 'hidden lg:flex flex-col h-full w-full bg-white'
      }
      onTouchStart={fullPlayer.isOpen ? fullPlayer.handleTouchStart : undefined}
      onTouchMove={fullPlayer.isOpen ? fullPlayer.handleTouchMove : undefined}
    >
      {fullPlayer.isOpen && (
        <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
          <div className="flex-1" />
          <div className="w-10 h-1 rounded-full bg-gray-3" />
          <div className="flex-1 flex justify-end">
            <button type="button" onClick={fullPlayer.close} className="p-2 rounded-full hover:bg-gray-4 text-primary transition-colors" title="닫기">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div ref={fullPlayer.scrollRef} className="flex-1 overflow-y-auto min-h-0">
        <NowPlaying />
        <QueueList />
      </div>
    </section>
  );

  return (
    <>
      <MiniPlayerBar onOpenFullPlayer={fullPlayer.open} />
      {section}
    </>
  );
}
