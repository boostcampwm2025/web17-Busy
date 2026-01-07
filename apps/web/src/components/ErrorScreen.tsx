'use client';

import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { FallbackProps } from 'react-error-boundary';

export default function ErrorScreen({ error, resetErrorBoundary }: FallbackProps) {
  const router = useRouter();

  const handleRetry = () => {
    startTransition(() => {
      router.refresh(); // 1. 서버 데이터 새로고침
      resetErrorBoundary(); // 2. 에러 바운더리 상태 초기화
    });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 border rounded-lg bg-red-50 text-center">
      <h2 className="text-lg font-bold text-red-600">오류가 발생했습니다</h2>
      {/* 에러 메시지 표시 */}
      <p className="text-sm text-gray-600">{error.message}</p>

      <button onClick={handleRetry} className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition">
        다시 시도
      </button>
    </div>
  );
}
