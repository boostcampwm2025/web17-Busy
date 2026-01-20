import { PostResponseDto } from './post.dto';

export class FindByUserDto {
  posts: PostResponseDto[];
  hasNext: boolean;
  nextCursor?: string;
}
