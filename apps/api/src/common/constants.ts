export const Provider = {
  SPOTIFY: 'spotify',
  GOOGLE: 'google',
} as const;

export type Provider = (typeof Provider)[keyof typeof Provider];

export const NotiType = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
};

export type NotiType = (typeof NotiType)[keyof typeof NotiType];
