import { MOCK_POSTS } from '@/constants';

/** 테스트용 임시 피드 데이터 조회 함수 */
export const getFeedPosts = async (cursor?: string, limit = 5) => {
  //throw new Error('error');
  const startIndex = cursor ? MOCK_POSTS.findIndex((post) => post.postId === cursor) + 1 : 0;
  const posts = MOCK_POSTS.slice(startIndex, startIndex + limit);

  const hasNext = startIndex + posts.length < MOCK_POSTS.length;
  const nextCursor = hasNext ? posts[posts.length - 1]!.postId : undefined;

  return {
    items: posts,
    hasNext,
    nextCursor,
  };
};
