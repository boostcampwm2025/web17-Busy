'use client';

import { useEffect, useMemo, useState } from 'react';
import type { NotiResponseDto } from '@repo/dto';
import { fetchNotis, markNotiRead } from '@/api/noti/fetchNotis';
import NotiItem from './NotiItem';
import { toNotiView } from './noti.mapper';
import { NotiView } from './noti.types';
import { MODAL_TYPES, useModalStore } from '@/stores';
import { useRouter } from 'next/navigation';

type FetchStatus = 'loading' | 'success' | 'empty' | 'error';

export default function NotiDrawerContent() {
  const openModal = useModalStore((s) => s.openModal);
  const router = useRouter();

  const [status, setStatus] = useState<FetchStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [raw, setRaw] = useState<NotiResponseDto[]>([]);

  const items = useMemo(() => raw.map(toNotiView), [raw]);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        setStatus('loading');
        setErrorMessage(null);

        const data = (await fetchNotis()) as NotiResponseDto[];

        if (!isActive) return;

        setRaw(data);
        setStatus(data.length > 0 ? 'success' : 'empty');
      } catch (e) {
        if (!isActive) return;
        const err = e as { message?: string };
        setStatus('error');
        setErrorMessage(err?.message ?? '알림 조회 중 오류가 발생했습니다.');
      }
    };

    void run();
    return () => {
      isActive = false;
    };
  }, []);

  const handleClickNoti = (noti: NotiView) => {
    if (!noti.isRead) {
      setRaw((prev) => prev.map((n) => (n.notiId === noti.id ? { ...n, isRead: true } : n)));

      void markNotiRead(noti.id).catch((err) => {
        console.error(err);
      });
    }

    if (noti.relatedType === 'user') {
      router.push(`/profile/${noti.relatedId}`);
      return;
    }

    openModal(MODAL_TYPES.CONTENT, { postId: noti.relatedId });
  };

  const renderBody = () => {
    if (status === 'loading') return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;
    if (status === 'error') return <div className="p-6 text-sm text-red-500">{errorMessage ?? '오류'}</div>;
    if (status === 'empty') return <div className="p-6 text-sm text-gray-400">알림이 없습니다.</div>;

    return (
      <div className="space-y-4 p-2">
        {items.map((noti) => (
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
