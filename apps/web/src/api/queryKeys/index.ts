import { authQueryKeys } from './auth';
import { notificationQueryKeys } from './notifications';
import { playlistQueryKeys } from './playlists';
import { postQueryKeys } from './posts';
import { profileQueryKeys } from './profiles';
import { userQueryKeys } from './users';

export const queryKeys = {
  auth: authQueryKeys,
  notifications: notificationQueryKeys,
  playlists: playlistQueryKeys,
  posts: postQueryKeys,
  profiles: profileQueryKeys,
  users: userQueryKeys,
} as const;
