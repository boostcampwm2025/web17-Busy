import { makePostDetailLog } from '@/api/internal/logging';
import { enqueueLog } from '@/utils/logQueue';

type PostDetailSummary = {
  postId: string;
  dwellMs: number;
  playedMusicCount: number;
  listenMsByMusic: Record<string, number>;
};

export const enqueuePostDetailSummary = (summary: PostDetailSummary) => {
  enqueueLog(makePostDetailLog(summary));
};
