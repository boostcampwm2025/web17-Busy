type QueryParams = Readonly<Record<string, string | number | boolean | null | undefined>>;

const profilePostsKey = ['profile', 'posts'] as const;

export const postQueryKeys = {
  feed: (params?: QueryParams) => (params ? (['feed', params] as const) : (['feed'] as const)),
  profiles: profilePostsKey,
  /** 프로필 격자용. `PostPreviewDto` 목록을 담는다. */
  profile: (userId: string) => [...profilePostsKey, userId] as const,
  /**
   * 모바일 프로필 피드용. 같은 사용자의 게시글이지만 `PostResponseDto` 전체를 담으므로
   * `profile`과 캐시를 공유하면 서로 다른 형태의 데이터가 같은 key에 섞인다.
   */
  profileFull: (userId: string) => [...profilePostsKey, 'full', userId] as const,
  detail: (postId: string) => ['post', postId] as const,
  comments: (postId: string) => ['postComments', postId] as const,
  likedUsers: (postId: string) => ['postLikedUsers', postId] as const,
} as const;
