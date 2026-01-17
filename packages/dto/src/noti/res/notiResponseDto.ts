import { NotiType } from '../noti-type.enum';

export class NotiResponseDto {
  notiId: string;
  actor: {
    userId: string;
    nickname: string;
    profileImgUrl: string;
  };
  type: NotiType;
  relatedId?: string | null;
  isRead: boolean;
  createdAt: string;
  imgUrl: string;
}
