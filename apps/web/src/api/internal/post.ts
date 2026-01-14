import { FeedResponseDto } from '@repo/dto/post/res/feedResponseDto';
import { internalClient } from './client';

export const getFeedPosts = async (cursor?: string, limit = 10) => {
  const { data } = await internalClient.get<FeedResponseDto>('/post/feed', { params: { limit, cursor } });

  return {
    posts,
    hasNext,
    nextCursor,
  };
};
