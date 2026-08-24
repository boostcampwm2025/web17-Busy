import { CONTENT_SEARCH_TAB_ENTRIES } from '@/constants/search';
import type { ContentSearchMode, SearchMode } from '@/types/search';

type Props = {
  mode: SearchMode;
  onChange: (mode: ContentSearchMode) => void;
};

export function SearchTabs({ mode, onChange }: Props) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white/70 p-1 shadow-sm">
      <div className="flex text-center gap-1">
        {CONTENT_SEARCH_TAB_ENTRIES.map(([tabMode, tabTitle]) => (
          <button
            key={tabMode}
            type="button"
            title={`${tabTitle} 검색 탭`}
            aria-pressed={mode === tabMode}
            onClick={() => onChange(tabMode)}
            className={`flex-1 rounded-md px-3 py-2 text-sm sm:text-base transition-colors ${
              mode === tabMode ? 'bg-primary font-bold text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
            }`}
          >
            {tabTitle}
          </button>
        ))}
      </div>
    </div>
  );
}
