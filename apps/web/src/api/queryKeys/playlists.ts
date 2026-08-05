export const playlistQueryKeys = {
  all: ['playlists'] as const,
  detail: (playlistId: string) => ['playlists', 'detail', playlistId] as const,
} as const;
