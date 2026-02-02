import { PostResponseDto } from './post.dto';

export class FeedResponseDto {
  posts: PostResponseDto[];
  hasNext: boolean;
  nextCursor?: string;
  nextPopularCursor?: string;
  nextRecentCursor?: string;
}
