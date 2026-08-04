type QueryParams = Readonly<Record<string, string | number | boolean | null | undefined>>;

const profilePostsKey = ['profile', 'posts'] as const;

export const postQueryKeys = {
  feed: (params?: QueryParams) => (params ? (['feed', params] as const) : (['feed'] as const)),
  profiles: profilePostsKey,
  profile: (userId: string) => [...profilePostsKey, userId] as const,
  detail: (postId: string) => ['post', postId] as const,
  comments: (postId: string) => ['postComments', postId] as const,
  likedUsers: (postId: string) => ['postLikedUsers', postId] as const,
} as const;
