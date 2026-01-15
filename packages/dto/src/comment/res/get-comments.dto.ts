interface comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    nickname: string;
    profileImgUrl: string;
  };
}

export class GetCommentsResDto {
  comments: comment[];
}
