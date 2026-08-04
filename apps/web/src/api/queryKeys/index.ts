import { authQueryKeys } from './auth';
import { notificationQueryKeys } from './notifications';
import { playlistQueryKeys } from './playlists';
import { postQueryKeys } from './posts';

export const queryKeys = {
  auth: authQueryKeys,
  notifications: notificationQueryKeys,
  playlists: playlistQueryKeys,
  posts: postQueryKeys,
} as const;
