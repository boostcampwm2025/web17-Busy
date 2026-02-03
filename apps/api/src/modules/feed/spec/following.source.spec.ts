import { FollowingSource } from '../sources/following.source';

describe('FollowingSource (mock only)', () => {
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

  let source: FollowingSource;

  beforeEach(() => {
    jest.clearAllMocks();

    source = new FollowingSource(postRepository as any);
  });

  it('비초기 + cursor 없으면 posts: [] 즉시 반환', async () => {
    // when
    const res = await source.getPosts(false, 'u1', 10, undefined);

    // then
    expect(res).toEqual({ posts: [] });
    expect(postRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
