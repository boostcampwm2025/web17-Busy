import { Search, X } from 'lucide-react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onFocus: () => void;
};

export default function MusicSearchInput({ value, onChange, onFocus }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value);

  // mousedown에서 막지 않으면 input이 blur되며 드롭다운이 먼저 닫혀 클릭이 사라진다.
  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onChange('');
  };

  return (
    <div className="relative z-20">
      <input
        id="musicQuery"
        type="text"
        placeholder="어떤 음악을 공유하고 싶나요?"
        value={value}
        onChange={handleChange}
        onFocus={onFocus}
        className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-primary text-primary placeholder:text-gray-2
                   focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-accent-cyan transition-all font-medium"
      />
      <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-2" />
      {value && (
        <button
          type="button"
          onMouseDown={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-2 hover:bg-gray-1 flex items-center justify-center transition-colors"
          aria-label="검색어 지우기"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
}
