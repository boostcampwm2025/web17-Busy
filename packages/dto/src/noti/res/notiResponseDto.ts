export class NotiResponseDto {
  notiId: string;
  actor: {
    userId: string;
    nickname: string;
    profileImgUrl: string;
  };
  type: 'FOLLOW' | 'LIKE' | 'COMMENT';
  relatedId: string;
  isRead: boolean;
  imgUrl: string;
}
