'use client';

import { useEffect, useMemo, useState } from 'react';
import type { NotiResponseDto } from '@repo/dto';
import { fetchNotis, markNotiRead } from '@/api/noti/fetchNotis';

type FetchStatus = 'loading' | 'success' | 'empty' | 'error';

type NotiVM = {
  id: string;
  isRead: boolean;
  createdAtText: string;
  message: string;
  avatarUrl?: string | null;
  targetImgUrl?: string | null;
  kind: 'user' | 'target';
};

function formatKoreanTime(iso: string) {
  // 일단 단순 표시 (원하면 “n분 전”으로 바꿔줄게)
  return new Date(iso).toLocaleString('ko-KR', { hour12: false });
}

function toNotiMessage(n: NotiResponseDto) {
  const name = n.actor.nickname;

  switch (n.type) {
    case 'comment':
      return `${name}님이 댓글을 남겼어.`;
    case 'like':
      return `${name}님이 좋아요를 눌렀어.`;
    case 'follow':
      return `${name}님이 팔로우했어.`;
    default:
      return `${name}님의 알림이 도착했어.`;
  }
}

function toNotiVM(n: NotiResponseDto): NotiVM {
  return {
    id: n.notiId,
    isRead: n.isRead,
    createdAtText: formatKoreanTime(n.createdAt as unknown as string), // 백에서 Date로 내려줘도 실제론 string일 확률 높음
    message: toNotiMessage(n),
    avatarUrl: n.actor.profileImgUrl ?? null,
    targetImgUrl: n.imgUrl && n.imgUrl.length > 0 ? n.imgUrl : null,
    kind: 'user',
  };
}

function NotiItem({ noti, onClick }: { noti: NotiVM; onClick: (id: string) => void }) {
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

export default function NotiDrawerContent() {
  const [status, setStatus] = useState<FetchStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [raw, setRaw] = useState<NotiResponseDto[]>([]);

  const items = useMemo(() => raw.map(toNotiVM), [raw]);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        setStatus('loading');
        setErrorMessage(null);

        // TODO: 너 api 레이어에 맞게 교체
        const data = (await fetchNotis()) as NotiResponseDto[];
        // const data: NotiResponseDto[] = []; // 임시

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

  const handleClickNoti = async (id: string) => {
    // ✅ optimistic: 클릭하면 즉시 읽음 처리(UX 좋음)
    setRaw((prev) => prev.map((n) => (n.notiId === id ? { ...n, isRead: true } : n)));

    try {
      // TODO: PATCH /noti/:id
      await markNotiRead(id);
    } catch {
      // 실패하면 롤백(선택)
      setRaw((prev) => prev.map((n) => (n.notiId === id ? { ...n, isRead: false } : n)));
    }
  };

  const renderBody = () => {
    if (status === 'loading') return <div className="p-6 text-sm text-gray-400">불러오는 중...</div>;
    if (status === 'error') return <div className="p-6 text-sm text-red-500">{errorMessage ?? '오류'}</div>;
    if (status === 'empty') return <div className="p-6 text-sm text-gray-400">알림이 없어.</div>;

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
