export class NotiResponseDto {
  notiId: string;
  actor: {
    userId: string;
    nickname: string;
    profileImgUrl: string;
  };
  type: string; // enum... 백엔드를 참조할 순 없어서... 임시...
  relatedId: string;
  isRead: boolean;
  imgUrl: string;
}
