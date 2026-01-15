export class NotiResponseDto {
  notiId: string;
  actor: {
    userId: string;
    nickname: string;
    profileImgUrl: string;
  };
  type: 'follow' | 'like' | 'comment';
  relatedId: string;
  relatedType: 'post' | 'user';
  isRead: boolean;
  createdAt: string;
  thumbnailUrl: string;
  thumbnailShape: 'circle' | 'square';
}
