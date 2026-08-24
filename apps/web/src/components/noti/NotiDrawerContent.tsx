'use client';

import { useMemo } from 'react';
import { CheckCheck, Trash2 } from 'lucide-react';
import NotiItem from './NotiItem';
import { toNotiView } from '@/mappers/noti-to-view';
import { NotiView } from '@/types/noti';
import { MODAL_TYPES, useModalStore } from '@/stores';
import { useRouter } from 'next/navigation';
import ConfirmOverlay from '@/components/common/ConfirmOverlay';
import { useConfirm } from '@/hooks/common/use-confirm';
import { useNotificationMutations, useNotificationsQuery } from '@/hooks';

export default function NotiDrawerContent({ onNavigate }: { onNavigate?: () => void }) {
  const openModal = useModalStore((s) => s.openModal);
  const router = useRouter();

  const { notifications: rawNotis, status: notiFetchStatus, errorMessage } = useNotificationsQuery();
  const { readNoti, readAllNotis, deleteAllNotis, isReadingAllNotis, isDeletingAllNotis } = useNotificationMutations();
  const deleteAllConfirm = useConfirm(deleteAllNotis);

  const notis = useMemo(() => {
    return rawNotis.map(toNotiView).sort((a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime());
  }, [rawNotis]);

  const handleClickNoti = (noti: NotiView) => {
    if (!noti.isRead) {
      readNoti(noti.id);
    }

    if (noti.relatedType === 'user') {
      onNavigate?.();
      router.push(`/profile/${noti.relatedId}`);
      return;
    }

    openModal(MODAL_TYPES.POST_DETAIL, { postId: noti.relatedId });
  };

  const handleMarkRead = (noti: NotiView) => {
    if (!noti.isRead) readNoti(noti.id);
  };

  const renderBody = () => {
    if (notiFetchStatus === 'no-login') return <div className="p-6 text-m text-gray-400">로그인 후 확인해 주세요.</div>;
    if (notiFetchStatus === 'loading') return <div className="p-6 text-m text-gray-400">불러오는 중...</div>;
    if (notiFetchStatus === 'error') return <div className="p-6 text-m text-red-500">{errorMessage ?? '오류'}</div>;
    if (notis.length === 0) return <div className="p-6 text-m text-gray-400">알림이 없습니다.</div>;
    return (
      <div className="space-y-4 p-2">
        {notis.map((noti) => (
          <NotiItem key={noti.id} noti={noti} onClick={handleClickNoti} onMarkRead={handleMarkRead} />
        ))}
      </div>
    );
  };

  const hasNotis = notis.length > 0;
  const hasUnread = notis.some((noti) => !noti.isRead);

  return (
    <div className="flex flex-col h-full">
      {hasNotis && (
        <div className="flex justify-end gap-4 px-3 py-2">
          <button
            type="button"
            onClick={() => readAllNotis()}
            disabled={!hasUnread || isReadingAllNotis}
            className="flex items-center gap-1 rounded-full bg-primary/80 px-3 py-1 text-s text-white hover:bg-primary disabled:opacity-40 disabled:cursor-default disabled:hover:bg-primary/85 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            모두 읽음
          </button>
          <button
            type="button"
            onClick={deleteAllConfirm.open}
            disabled={isDeletingAllNotis}
            className="flex items-center gap-1 rounded-full border border-gray-3 px-3 py-1 text-s text-gray-1 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            모두 삭제
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">{renderBody()}</div>

      <ConfirmOverlay
        open={deleteAllConfirm.isOpen}
        title="알림을 모두 삭제할까요?"
        onCancel={deleteAllConfirm.cancel}
        onConfirm={deleteAllConfirm.confirm}
      />
    </div>
  );
}
