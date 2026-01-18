import { UserDto } from '../../user';
import { NotiType } from '../noti-type.enum';

export enum NotiRelatedType {
  POST = 'post',
  USER = 'user',
}

export enum NotiThumbnailShapeType {
  CIRCLE = 'circle',
  SQUARE = 'square',
}

export class NotiResponseDto {
  id: string;
  actor: UserDto;
  type: NotiType;
  relatedId: string | null;
  relatedType: NotiRelatedType;
  isRead: boolean;
  createdAt: string;
  thumbnailUrl: string;
  thumbnailShape: NotiThumbnailShapeType;
}
