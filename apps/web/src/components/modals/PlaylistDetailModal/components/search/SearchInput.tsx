import { Search, XCircle } from 'lucide-react';

type Props = {
  value: string;
  onChange: (nextValue: string) => void;
  onClear: () => void;
};

export function SearchInput({ value, onChange, onClear }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="추가할 음악 검색..."
        value={value}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-primary focus:outline-none focus:ring-2 focus:ring-accent bg-white font-medium"
      />
      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

      {value.length > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-2 hover:text-primary"
          title="검색어 지우기"
        >
          <XCircle className="w-5 h-5" />
        </button>
      ) : null}
    </div>
  );
}
