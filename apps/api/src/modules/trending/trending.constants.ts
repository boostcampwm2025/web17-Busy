export const TRENDING_WEIGHTS = {
  view: 1,
  like: 5,
  unlike: -5,
  comment: 10,
  play: 3,
} as const;

export type TrendingInteractionType = keyof typeof TRENDING_WEIGHTS;

export const TRENDING_CONSUMER_GROUP_NAME = 'cg:trending';
