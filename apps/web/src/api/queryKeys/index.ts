import { authQueryKeys } from './auth';
import { playlistQueryKeys } from './playlists';
import { postQueryKeys } from './posts';

export const queryKeys = {
  auth: authQueryKeys,
  playlists: playlistQueryKeys,
  posts: postQueryKeys,
} as const;
