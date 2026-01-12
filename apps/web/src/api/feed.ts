/** 테스트용 임시 피드 데이터 조회 함수 */
export const getFeedPosts = async (cursor = 0, limit = 5) => {
  const posts = MOCK_POSTS.slice(cursor, cursor + limit);
  const hasNext = cursor + limit < MOCK_POSTS.length;
  const nextCursor = hasNext ? cursor + posts.length : undefined;

  return {
    posts,
    hasNext,
    nextCursor,
  };
};

const MOCK_POSTS = [
  { id: 1, title: 'a' },
  { id: 2, title: 'b' },
  { id: 3, title: 'c' },
  { id: 4, title: 'd' },
  { id: 5, title: 'e' },
  { id: 6, title: 'f' },
  { id: 7, title: 'g' },
  { id: 8, title: 'h' },
  { id: 9, title: 'i' },
  { id: 10, title: 'j' },
  { id: 11, title: 'k' },
  { id: 12, title: 'l' },
  { id: 13, title: 'm' },
  { id: 14, title: 'n' },
  { id: 15, title: 'o' },
  { id: 16, title: 'p' },
  { id: 17, title: 'q' },
  { id: 18, title: 'r' },
  { id: 19, title: 's' },
  { id: 20, title: 't' },
];
