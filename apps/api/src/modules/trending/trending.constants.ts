import { CronExpression } from '@nestjs/schedule';

export const TRENDING_WEIGHTS = {
  view: 1,
  like: 5,
  unlike: -5,
  comment: 10,
  play: 3,
} as const;

export type TrendingInteractionType = keyof typeof TRENDING_WEIGHTS;

export const TRENDING_CONSUMER_GROUP_NAME = 'cg:trending';
export const TRENDING_STREAM_BATCH_SIZE = 500;
export const TRENDING_AGGREGATION_INTERVAL = CronExpression.EVERY_5_MINUTES;
