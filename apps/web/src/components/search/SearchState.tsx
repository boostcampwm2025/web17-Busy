'use client';

import { AlertTriangle, Search } from 'lucide-react';

type SearchStateVariant = 'hint' | 'empty' | 'error';

interface SearchStateProps {
  variant: SearchStateVariant;
  message?: string;
}

const DEFAULT_MESSAGES: Record<SearchStateVariant, string> = {
  hint: '새로운 음악을 찾아보세요',
  empty: '검색 결과가 없습니다.',
  error: '검색 중 오류가 발생했습니다.',
};

export default function SearchState({ variant, message }: SearchStateProps) {
  const text = message ?? DEFAULT_MESSAGES[variant];

  if (variant === 'error') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-gray-2 py-10">
        <AlertTriangle className="w-10 h-10 mb-3" />
        <p className="font-bold text-sm">{text}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-gray-2 py-10">
      <Search className="w-10 h-10 mb-3 opacity-60" />
      <p className="font-bold text-sm">{text}</p>
      {variant === 'hint' ? <p className="text-xs mt-2 text-gray-2">@사용자 검색은 #36에서 확장</p> : null}
    </div>
  );
}
