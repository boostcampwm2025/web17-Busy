import { NotiRelatedType, NotiThumbnailShapeType } from '@repo/dto';

export type NotiView = {
  id: string;
  isRead: boolean;

  createdAtIso: string;
  createdAtText: string;

  actorUserId: string;
  actorNickname: string;
  actorProfileImgUrl: string;

  messageBody: string;

  thumbnailUrl: string;
  thumbnailShape: NotiThumbnailShapeType;

  relatedId: string;
  relatedType: NotiRelatedType;
};
