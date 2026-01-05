export const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';

// todo - 추후 세부 결정 필요
export const SCOPES = [
  'app-remote-control', // 모바일에서 필요
  'streaming',
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing',
].join(' ');
