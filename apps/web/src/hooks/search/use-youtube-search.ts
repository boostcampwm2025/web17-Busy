'use client';

import { searchYoutubeVideos } from '@/api/youtube/searchVideos';
import { queryKeys } from '@/api/queryKeys';
import { youtubeVideoToMusic } from '@/mappers/youtube-video-to-music';
import { YOUTUBE_SEARCH } from '@/constants/search';

import { useExternalSearchQuery, type ExternalSearchResult } from './use-external-search-query';

type Options = {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
};

export default function useYoutubeSearch({
  query,
  enabled = true,
  debounceMs = YOUTUBE_SEARCH.DEBOUNCE_MS,
  minQueryLength = YOUTUBE_SEARCH.MIN_QUERY_LENGTH,
}: Options): ExternalSearchResult {
  return useExternalSearchQuery({
    query,
    enabled,
    debounceMs,
    minQueryLength,
    buildQueryKey: (trimmedQuery) => queryKeys.search.youtube(trimmedQuery),
    fetchResults: async (trimmedQuery, signal) => {
      const items = await searchYoutubeVideos({ keyword: trimmedQuery, signal });

      return items.map(youtubeVideoToMusic);
    },
  });
}
