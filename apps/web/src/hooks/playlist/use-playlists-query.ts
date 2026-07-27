'use client';

import { useQuery } from '@tanstack/react-query';

import { getAllPlaylists, queryKeys } from '@/api';

export const usePlaylistsQuery = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: queryKeys.playlists.all,
    queryFn: getAllPlaylists,
    enabled,
  });
