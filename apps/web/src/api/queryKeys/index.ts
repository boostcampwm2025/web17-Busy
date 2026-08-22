import { authQueryKeys } from './auth';
import { consentQueryKeys } from './consents';
import { notificationQueryKeys } from './notifications';
import { playlistQueryKeys } from './playlists';
import { postQueryKeys } from './posts';
import { profileQueryKeys } from './profiles';
import { searchQueryKeys } from './search';
import { userQueryKeys } from './users';

export const queryKeys = {
  auth: authQueryKeys,
  consents: consentQueryKeys,
  notifications: notificationQueryKeys,
  playlists: playlistQueryKeys,
  posts: postQueryKeys,
  profiles: profileQueryKeys,
  search: searchQueryKeys,
  users: userQueryKeys,
} as const;
