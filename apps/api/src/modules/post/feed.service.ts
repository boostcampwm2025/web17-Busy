import { Injectable } from '@nestjs/common';
import { FeedResponseDto } from '@repo/dto/post/res/feedResponseDto';

@Injectable()
export class FeedService {
  async feed(
    requestUserId: string | null,
    limit: number,
    cursor?: string,
  ): Promise<FeedResponseDto> {
    // todo

    return {
      hasNext: false,
      nextCursor: '111',
      posts: [],
    };
  }
}
