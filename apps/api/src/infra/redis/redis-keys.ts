export const REDIS_KEYS = {
  TRENDING_POSTS: 'rank:trending:posts',
  // 원천 이벤트 스트림(Neo4j/분석 워커가 소비)
  LOG_EVENTS_STREAM: 'stream:log:events',
} as const;
