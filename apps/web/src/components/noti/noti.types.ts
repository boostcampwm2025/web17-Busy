export type NotiView = {
  id: string;
  isRead: boolean;

  createdAtIso: string;
  createdAtText: string;

  actorUserId: string;
  actorNickname: string;
  actorProfileImgUrl: string | null;

  messageBody: string;

  thumbnailUrl: string;
  thumbnailShape: 'circle' | 'square';

  relatedId: string;
  relatedType: 'post' | 'user';
};
