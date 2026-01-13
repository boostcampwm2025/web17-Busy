import { MusicResponse, UserResponse, PostResponse } from './shared';

export class FeedResponseDto {
  posts: PostResponse[];
  hasNest: boolean;
  nextCursor: string;
}
