'use client';

import { CircleAlert } from 'lucide-react';

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-[90vh] flex-col items-center justify-center gap-4 p-6 text-center overflow-hidden">
      <CircleAlert className="text-gray-1" />
      <h2 className="text-lg font-bold text-error">오류가 발생했습니다</h2>
      <p className="text-sm text-gray-600">{error.message}</p>
      <button onClick={reset} className="rounded bg-error px-4 py-2 mt-2 text-white hover:bg-red-700 transition">
        다시 시도
      </button>
    </div>
  );
}
