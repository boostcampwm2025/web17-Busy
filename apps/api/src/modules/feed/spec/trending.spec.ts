import { PostRepository } from 'src/modules/post/post.repository';
import { TrendingSource } from '../sources/trending.source';
import { InternalServerErrorException } from '@nestjs/common';

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

  it('cursor 숫자 파싱해서 getByMaxScore에 maxScoreExclusive 전달', async () => {
    // given
    trendingService.getByMaxScore.mockResolvedValue(makeMembers([50, 40]));
    redis.get.mockResolvedValue(null); // group 필터 x

    const qb = makeQb();
    qb.getMany.mockResolvedValue([]);
    postRepository.createQueryBuilder.mockReturnValue(qb);

    // when
    await source.getPosts(true, null, 1, '123');

    expect(trendingService.getByMaxScore).toHaveBeenCalledWith(123);
  });

  it('userGroupId 있고 members.length > limit면 pipeline 기반 group 필터 수행', async () => {
    // given
    // 인기글 조회 결과 mocking
    trendingService.getByMaxScore.mockResolvedValue([
      { postId: 'p1', score: 100 },
      { postId: 'p2', score: 90 },
      { postId: 'p3', score: 80 },
      { postId: 'p4', score: 70 },
      { postId: 'p5', score: 60 },
    ]);

    // 로그인 유저 그룹 G1
    redis.get.mockResolvedValue('G1');

    // 각 게시글 별 그룹 id mocking
    const pipeline = makePipeline();
    pipeline.exec.mockResolvedValue([
      [null, 'G1'],
      [null, 'G1'],
      [null, 'G2'], // filtering 대상
      [null, 'G3'], // filtering 대상
      [null, 'G1'],
    ]);
    redis.pipeline.mockReturnValue(pipeline);

    const qb = makeQb();
    qb.getMany.mockResolvedValue([]); // hydrate 결과는 여기서 테스트 X
    postRepository.createQueryBuilder.mockReturnValue(qb);

    // 필터링 된 게시글 확인 spy
    const andWhereSpy = qb.andWhere;

    // when
    // limit는
    const res = await source.getPosts(true, 'u1', 3, undefined);

    // then
    expect(pipeline.get).toHaveBeenCalledTimes(5);
    expect(pipeline.exec).toHaveBeenCalledTimes(1);

    // p4, p5는 이전에 필터링 됨
    expect(andWhereSpy).toHaveBeenCalledWith('post.id IN (:...postIds)', {
      postIds: ['p1', 'p2', 'p5'],
    });

    // nextCursor
    expect(res.nextCursor).toBeUndefined();
  });

  it('pipeline.exec()가 null이면 InternalServerErrorException', async () => {
    // given
    trendingService.getByMaxScore.mockResolvedValue(makeMembers([10, 9, 8, 7]));
    redis.get.mockResolvedValue('G1');

    const pipeline = makePipeline();
    pipeline.exec.mockResolvedValue(null);
    redis.pipeline.mockReturnValue(pipeline);

    // when, then
    await expect(
      source.getPosts(true, 'u1', 2, undefined),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
