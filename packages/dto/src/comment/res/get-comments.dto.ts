interface comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    nickname: string;
    profileImgUrl: string;
  };
}

export class GetCommentsResDto {
  comments: comment[];
}
