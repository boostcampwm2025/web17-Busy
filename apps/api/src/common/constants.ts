export const NotiType = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
};

export type NotiType = (typeof NotiType)[keyof typeof NotiType];
