import { ClientFeedResponseDto } from '@repo/dto/post/res/feedResponseDto';
import { internalClient } from './client';

export const getFeedPosts = async (cursor?: string, limit = 10) => {
  const { data } = await internalClient.get<ClientFeedResponseDto>('/post/feed', { params: { limit, cursor } });
  return data;
};
