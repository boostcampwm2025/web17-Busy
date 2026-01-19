'use client';

import { useMemo } from 'react';
import NotiItem from './NotiItem';
import { toNotiView } from './noti.mapper';
import { NotiView } from './noti.types';
import { MODAL_TYPES, useModalStore } from '@/stores';
import { useRouter } from 'next/navigation';
import { useNotiStore } from '@/stores/useNotiStore';

export default function NotiDrawerContent() {
  const openModal = useModalStore((s) => s.openModal);
  const router = useRouter();

  const rawNotis = useNotiStore((s) => s.notis);
  const notiFetchStatus = useNotiStore((s) => s.status);
  const readNoti = useNotiStore((s) => s.readNoti);
  const errorMessage = useNotiStore((s) => s.errorMessage);

  const notis = useMemo(() => rawNotis.map(toNotiView), [rawNotis]);

  const handleClickNoti = (noti: NotiView) => {
    if (!noti.isRead) {
      readNoti(noti.id);
    }

    if (noti.relatedType === 'user') {
      router.push(`/profile/${noti.relatedId}`);
      return;
    }

    openModal(MODAL_TYPES.POST_DETAIL, { postId: noti.relatedId });
  };

  const renderBody = () => {
    if (notiFetchStatus === 'no-login') return <div className="p-6 text-m text-gray-400">로그인 후 확인해 주세요.</div>;
    if (notiFetchStatus === 'loading') return <div className="p-6 text-m text-gray-400">불러오는 중...</div>;
    if (notiFetchStatus === 'error') return <div className="p-6 text-m text-red-500">{errorMessage ?? '오류'}</div>;
    if (notis.length === 0) return <div className="p-6 text-m text-gray-400">알림이 없습니다.</div>;
    return (
      <div className="space-y-4 p-2">
        {notis.map((noti) => (
          <NotiItem key={noti.id} noti={noti} onClick={handleClickNoti} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b-2 border-primary/10 flex items-center justify-between">
        <h2 className="text-3xl font-black text-primary">알림</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">{renderBody()}</div>
    </div>
  );
}
