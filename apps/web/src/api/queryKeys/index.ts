import { authQueryKeys } from './auth';
import { notificationQueryKeys } from './notifications';
import { playlistQueryKeys } from './playlists';
import { postQueryKeys } from './posts';
import { profileQueryKeys } from './profiles';
import { searchQueryKeys } from './search';
import { userQueryKeys } from './users';

export const queryKeys = {
  auth: authQueryKeys,
  notifications: notificationQueryKeys,
  playlists: playlistQueryKeys,
  posts: postQueryKeys,
  profiles: profileQueryKeys,
  search: searchQueryKeys,
  users: userQueryKeys,
} as const;
