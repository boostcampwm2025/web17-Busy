'use client';

import { useQuery } from '@tanstack/react-query';

import { getAllPlaylists } from '@/api/internal/playlist';
import { queryKeys } from '@/api/queryKeys';

export const usePlaylistsQuery = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: queryKeys.playlists.all,
    queryFn: getAllPlaylists,
    enabled,
  });
