import { MusicResponse, UserResponse, PostResponse } from './shared';

export class FeedResponseDto {
  posts: PostResponse[];
  hasNext: boolean;
  nextCursor?: string;
}
