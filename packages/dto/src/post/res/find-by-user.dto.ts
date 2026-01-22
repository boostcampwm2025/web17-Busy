export class PostPreviewDto {
  postId: string;
  coverImgUrl: string;
  likeCount: number;
  commentCount: number;
  isMoreThanOneMusic: boolean;
}

export class FindByUserDto {
  posts: PostPreviewDto[];
  hasNext: boolean;
  nextCursor?: string;
}
