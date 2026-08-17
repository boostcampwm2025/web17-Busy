import { PostResponseDto } from './post.dto';

export class PostPreviewDto {
  postId: string;
  coverImgUrl: string;
  likeCount: number;
  commentCount: number;
  isMoreThanOneMusic: boolean;
}

/** 프로필 격자용. 썸네일 렌더링에 필요한 최소 필드만 담는다. */
export class FindByUserDto {
  posts: PostPreviewDto[];
  hasNext: boolean;
  nextCursor?: string;
}

/**
 * 프로필 피드용. 카드 렌더링에 필요한 전체 게시글을 담는다.
 * 격자는 `FindByUserDto`를 그대로 쓰므로 이 응답의 추가 필드가 격자 페이로드를 무겁게 만들지 않는다.
 */
export class FindByUserFeedDto {
  posts: PostResponseDto[];
  hasNext: boolean;
  nextCursor?: string;
}
