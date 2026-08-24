import type { ContentSearchMode, SearchMode } from '@/types/search';

export const ITUNES_SEARCH = {
  DEBOUNCE_MS: 300,
  MIN_QUERY_LENGTH: 2,
  DEFAULT_LIMIT: 20,
  COUNTRY: 'KR' as const,
} as const;

export const YOUTUBE_SEARCH = {
  DEBOUNCE_MS: 500,
  MIN_QUERY_LENGTH: 2,
  DEFAULT_LIMIT: 30,
  COUNTRY: 'KR' as const,
} as const;

export const SEARCH_TAB_TITLES = {
  music: '음원',
  user: '사용자',
  video: '유튜브',
} as const satisfies Record<SearchMode, string>;

export const SEARCH_TAB_ENTRIES = Object.entries(SEARCH_TAB_TITLES) as [SearchMode, string][];

/** 사용자 탭이 없는 화면용. 호출부마다 map 안에서 'user'를 걸러내던 것을 여기서 한 번에 정한다. */
export const CONTENT_SEARCH_TAB_ENTRIES = SEARCH_TAB_ENTRIES.filter(([mode]) => mode !== 'user') as [ContentSearchMode, string][];
