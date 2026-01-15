import { PostResponse, ClientPostResponse } from './shared';

export class FeedResponseDto {
  posts: PostResponse[];
  hasNext: boolean;
  nextCursor?: string;
}

export class ClientFeedResponseDto {
  posts: ClientPostResponse[];
  hasNext: boolean;
  nextCursor?: string;
}
