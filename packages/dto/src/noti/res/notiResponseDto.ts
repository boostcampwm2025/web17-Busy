import { UserDto } from '../../user';
import { NotiType } from '../noti-type.enum';

export class NotiResponseDto {
  notiId: string;
  actor: UserDto;
  type: NotiType;
  relatedId?: string | null;
  isRead: boolean;
  createdAt: string;
  imgUrl: string;
}
