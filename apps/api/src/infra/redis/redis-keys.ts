export const REDIS_KEYS = {
  TRENDING_POSTS: 'rank:trending:posts',
  // 원천 이벤트 스트림(Neo4j/분석 워커가 소비)
  LOG_EVENTS_STREAM: 'stream:log:events',

  /** 이미 받은 로그 이벤트 표식. 재시도로 같은 이벤트가 다시 와도 한 번만 적재한다. */
  LOG_EVENT_SEEN: (eventId: string) => `log:seen:${eventId}`,
  /** 중복이라 막은 누적 건수 */
  LOG_DUPLICATES_BLOCKED: 'metrics:log:duplicates-blocked',

  USER_GROUP: (userId: string) => `users:${userId}:group`,
  POST_GROUP: (postId: string) => `posts:${postId}:group`,
} as const;
