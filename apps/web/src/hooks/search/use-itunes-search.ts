'use client';

import type { MusicResponseDto as Music } from '@repo/dto';
import { searchItunesSongs } from '@/api/itunes/searchSongs';
import { queryKeys } from '@/api/queryKeys';
import { ITUNES_SEARCH } from '@/constants/search';
import { itunesSongToMusic } from '@/mappers/itunes-song-to-music';

import { useExternalSearchQuery, type ExternalSearchResult } from './use-external-search-query';

type Options = {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
  country?: typeof ITUNES_SEARCH.COUNTRY;
};

const filterPlayable = (musics: Music[]): Music[] => musics.filter((m) => m.trackUri.trim().length > 0);

export default function useItunesSearch({
  query,
  enabled = true,
  debounceMs = ITUNES_SEARCH.DEBOUNCE_MS,
  minQueryLength = ITUNES_SEARCH.MIN_QUERY_LENGTH,
  limit = ITUNES_SEARCH.DEFAULT_LIMIT,
  country = ITUNES_SEARCH.COUNTRY,
}: Options): ExternalSearchResult {
  return useExternalSearchQuery({
    query,
    enabled,
    debounceMs,
    minQueryLength,
    buildQueryKey: (trimmedQuery) => queryKeys.search.itunes(trimmedQuery, limit, country),
    fetchResults: async (trimmedQuery, signal) => {
      const data = await searchItunesSongs({ keyword: trimmedQuery, limit, country, signal });

      return filterPlayable(data.results.map(itunesSongToMusic));
    },
  });
}
