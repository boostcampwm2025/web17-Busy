'use client';

import { Search, XCircle } from 'lucide-react';

interface SearchInputProps {
  value: string;
  placeholder?: string;
  onChange: (nextValue: string) => void;
  onClear: () => void;
}

export default function SearchInput({ value, placeholder = '음악 검색', onChange, onClear }: SearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClearClick = () => {
    onClear();
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 text-sm sm:text-base bg-gray-4 rounded-xl border-2 border-transparent focus:bg-white focus:border-primary focus:outline-none transition-all font-bold text-primary placeholder:text-gray-2"
      />
      <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-2" />

      {value.length > 0 ? (
        <button
          type="button"
          onClick={handleClearClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-2 hover:text-primary"
          title="검색어 지우기"
        >
          <XCircle className="w-5 h-5" />
        </button>
      ) : null}
    </div>
  );
}
