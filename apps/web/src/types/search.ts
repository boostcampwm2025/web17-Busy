export type SearchMode = 'music' | 'user' | 'video';
export type ContentSearchMode = Exclude<SearchMode, 'user'>;

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';
