type QueryParams = Readonly<Record<string, string | number | boolean | null | undefined>>;

const profilePostsKey = ['profilePosts'] as const;

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  playlists: {
    all: ['playlists'] as const,
    detail: (playlistId: string) => ['playlists', 'detail', playlistId] as const,
  },
  posts: {
    feed: (params?: QueryParams) => (params ? (['feed', params] as const) : (['feed'] as const)),
    profiles: profilePostsKey,
    profile: (userId: string) => [...profilePostsKey, userId] as const,
    detail: (postId: string) => ['post', postId] as const,
    comments: (postId: string) => ['postComments', postId] as const,
    likedUsers: (postId: string) => ['postLikedUsers', postId] as const,
  },
} as const;
