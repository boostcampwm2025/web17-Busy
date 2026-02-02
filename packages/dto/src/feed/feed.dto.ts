import { PostResponseDto } from '../post/res/post.dto';

export type Cursor = {
  following?: string;
  trending?: string;
  recent?: string;
};

export class FeedResponseDto {
  posts: PostResponseDto[];
  hasNext: boolean;
  nextCursor?: Cursor;
}
