import { TrendingSource } from '../sources/trending.source';

describe('TrendingSource (mock only)', () => {
  const trendingService = { getByMaxScore: jest.fn() };
  const redis = {
    get: jest.fn(),
    pipeline: jest.fn(),
  };
  const postRepository = { createQueryBuilder: jest.fn() };

  const makeQb = () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockReturnThis(),
    };
    return qb;
  };

  const makePipeline = () => {
    const pipeline: any = {
      get: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };
    return pipeline;
  };

  const makeMembers = (scores: number[]) => {
    return scores.map((s, i) => ({ postId: `p${i + 1}`, score: s }));
  };

  let source: TrendingSource;

  beforeEach(() => {
    jest.clearAllMocks();

    source = new TrendingSource(
      postRepository as any,
      redis as any,
      trendingService as any,
    );
  });

  it('비초기 + cursor 없으면 posts:[] 즉시 반환', async () => {
    // when
    const res = await source.getPosts(false, 'u1', 10, undefined);

    // then
    expect(res).toEqual({ posts: [] });
    expect(trendingService.getByMaxScore).not.toHaveBeenCalled();
  });
});
