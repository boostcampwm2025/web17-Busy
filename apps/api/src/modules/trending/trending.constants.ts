import { CronExpression } from '@nestjs/schedule';

export const TRENDING_WEIGHTS = {
  view: 1,
  like: 5,
  unlike: -5,
  comment: 10,
  play: 3,
} as const;

export type TrendingInteractionType = keyof typeof TRENDING_WEIGHTS;

// 로그 스트림 -> 점수 갱신 관련
export const TRENDING_CONSUMER_GROUP_NAME = 'cg:trending';
export const TRENDING_STREAM_BATCH_SIZE = 500;
export const TRENDING_AGGREGATION_INTERVAL = CronExpression.EVERY_5_MINUTES;

// decay 관련
export const TRENDING_DECAY_INTERVAL = CronExpression.EVERY_HOUR;
export const TRENDING_DECAY_FACTOR = 0.9;
export const TRENDING_DECAY_SCAN_BATCH_SIZE = 2000;
export const TRENDING_MIN_SCORE = 1;
