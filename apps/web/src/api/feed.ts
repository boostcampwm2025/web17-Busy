/** 테스트용 임시 피드 데이터 조회 함수 */
export const getFeedPosts = async (cursor?: string, limit = 5) => {
  //throw new Error('error');
  const startIndex = cursor ? MOCK_POSTS.findIndex((post) => post.id === cursor) + 1 : 0;
  const posts = MOCK_POSTS.slice(startIndex, startIndex + limit);

  const hasNext = startIndex + posts.length < MOCK_POSTS.length;
  const nextCursor = hasNext ? posts[posts.length - 1]!.id : undefined;

  return {
    posts,
    hasNext,
    nextCursor,
  };
};

const MOCK_POSTS = [
  { id: '018f0a10-1a00-7a01-8a3b-000000000001', title: 'a' },
  { id: '018f0a10-1a01-7a01-8a3b-000000000002', title: 'b' },
  { id: '018f0a10-1a02-7a01-8a3b-000000000003', title: 'c' },
  { id: '018f0a10-1a03-7a01-8a3b-000000000004', title: 'd' },
  { id: '018f0a10-1a04-7a01-8a3b-000000000005', title: 'e' },
  { id: '018f0a10-1a05-7a01-8a3b-000000000006', title: 'f' },
  { id: '018f0a10-1a06-7a01-8a3b-000000000007', title: 'g' },
  { id: '018f0a10-1a07-7a01-8a3b-000000000008', title: 'h' },
  { id: '018f0a10-1a08-7a01-8a3b-000000000009', title: 'i' },
  { id: '018f0a10-1a09-7a01-8a3b-00000000000a', title: 'j' },
  { id: '018f0a10-1a0a-7a01-8a3b-00000000000b', title: 'k' },
  { id: '018f0a10-1a0b-7a01-8a3b-00000000000c', title: 'l' },
  { id: '018f0a10-1a0c-7a01-8a3b-00000000000d', title: 'm' },
  { id: '018f0a10-1a0d-7a01-8a3b-00000000000e', title: 'n' },
  { id: '018f0a10-1a0e-7a01-8a3b-00000000000f', title: 'o' },
  { id: '018f0a10-1a0f-7a01-8a3b-000000000010', title: 'p' },
  { id: '018f0a10-1a10-7a01-8a3b-000000000011', title: 'q' },
  { id: '018f0a10-1a11-7a01-8a3b-000000000012', title: 'r' },
  { id: '018f0a10-1a12-7a01-8a3b-000000000013', title: 's' },
  { id: '018f0a10-1a13-7a01-8a3b-000000000014', title: 't' },
];
