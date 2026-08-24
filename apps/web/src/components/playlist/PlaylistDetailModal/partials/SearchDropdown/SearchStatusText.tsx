import type { ReactNode } from 'react';

/** 드롭다운 안에서 결과 대신 보여주는 한 줄 안내. */
export function SearchStatusText({ children }: { children: ReactNode }) {
  return <div className="p-4 text-center text-gray-2 text-sm">{children}</div>;
}
