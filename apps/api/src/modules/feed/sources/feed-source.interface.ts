import { Post } from 'src/modules/post/entities/post.entity';

export interface FeedSource {
  getPosts: (
    isInitialRequest: boolean,
    requestUserId: string | null,
    limit: number,
    cursor?: string,
  ) => Promise<{ posts: Post[]; nextCursor?: string }>;
}
