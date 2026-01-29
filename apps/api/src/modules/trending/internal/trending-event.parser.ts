import { kvToObj } from 'src/infra/redis/redis-stream.util';
import {
  TRENDING_WEIGHTS,
  TrendingInteractionType,
} from '../trending.constants';

export type ParsedTrendingEvent = { postId: string; weight: number };

export function parseTrendingEvent(kv: string[]): ParsedTrendingEvent | null {
  const event = kvToObj(kv);

  const eventType = event.eventType as TrendingInteractionType | undefined;
  const targetPostId = event.targetPostId;

  if (!eventType) return null;
  if (!targetPostId?.trim()) return null;

  const weight = TRENDING_WEIGHTS[eventType];
  if (weight === undefined) return null;

  return { postId: targetPostId, weight };
}
