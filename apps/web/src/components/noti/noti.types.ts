export type NotiView = {
  id: string;
  isRead: boolean;

  createdAtIso: string;
  createdAtText: string;

  actorNickname: string;
  messageBody: string;

  thumbnailUrl: string;
  thumbnailShape: 'circle' | 'square';

  relatedId: string;
  relatedType: 'post' | 'user';
};
