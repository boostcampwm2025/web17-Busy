import { UserDto } from '../../user';
import { NotiRelatedType } from '../noti-related.enum';
import { NotiThumbnailShapeType } from '../noti-thumbnail-shape.enum';
import { NotiType } from '../noti-type.enum';

export class NotiResponseDto {
  id: string;
  actor: UserDto;
  type: NotiType;
  relatedId: string;
  relatedType: NotiRelatedType;
  isRead: boolean;
  createdAt: string;
  thumbnailUrl: string | null;
  thumbnailShape: NotiThumbnailShapeType;
}
