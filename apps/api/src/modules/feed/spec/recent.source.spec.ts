import { RecentSource } from '../sources/recent.source';

describe('RecentSource (mock only)', () => {
  const repo = { createQueryBuilder: jest.fn() };

  const makeQb = () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    return qb;
  };

  const makeMockPost = (id: string) => ({ id }) as any;

  let source: RecentSource;

  beforeEach(() => {
    jest.clearAllMocks();

    source = new RecentSource(repo as any);
  });

  it('비초기 + cursor 없음이면 posts:[] 즉시 반환 + repo 호출 X', async () => {
    // when
    const res = await source.getPosts(false, 'u1', 10, undefined);

    // then
    expect(res).toEqual({ posts: [] });
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('requestUserId=null이면 likes join을 하지 않는다', async () => {
    // given
    const qb = makeQb();
    qb.getMany.mockResolvedValue([]);

    repo.createQueryBuilder.mockReturnValue(qb);

    // when
    await source.getPosts(true, null, 10, undefined);

    // then
    const calls = qb.leftJoinAndSelect.mock.calls.map((c: any[]) => c[0]);
    expect(calls).toEqual([
      'post.author',
      'post.postMusics',
      'postMusic.music',
    ]);
  });

  it('requestUserId가 있으면 likes join을 한다', async () => {
    // given
    const qb = makeQb();
    qb.getMany.mockResolvedValue([]);

    repo.createQueryBuilder.mockReturnValue(qb);

    // when
    await source.getPosts(true, 'u1', 10, undefined);

    // then
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'post.likes',
      'like',
      'like.userId = :requestUserId',
      { requestUserId: 'u1' },
    );
  });

  it('cursor가 있으면 andWhere(post.id < :cursor)를 추가한다', async () => {
    // given
    const qb = makeQb();
    qb.getMany.mockResolvedValue([]);

    repo.createQueryBuilder.mockReturnValue(qb);

    // when
    await source.getPosts(true, 'u1', 10, 'CURSOR');

    // then
    expect(qb.andWhere).toHaveBeenCalledWith('post.id < :cursor', {
      cursor: 'CURSOR',
    });
  });

  it('fetched.length > limit이면 slice 후 nextCursor를 마지막 id로 설정한다', async () => {
    // given
    const qb = makeQb();
    // limit은 3, 조회된 최신글은 4개
    qb.getMany.mockResolvedValue([
      makeMockPost('d'),
      makeMockPost('c'),
      makeMockPost('b'),
      makeMockPost('a'),
    ]);

    repo.createQueryBuilder.mockReturnValue(qb);

    // when
    const res = await source.getPosts(true, 'u1', 3, undefined);

    // then
    // limit + 1만큼 조회
    expect(qb.take).toHaveBeenCalledWith(4);

    // 최신 limit 개수만큼 조회
    expect(res.posts.map((p) => p.id)).toEqual(['d', 'c', 'b']);

    // nextCursor는 마지막꺼 id
    expect(res.nextCursor).toBe('b');
  });

  it('fetched.length <= limit이면 nextCursor는 undefined', async () => {
    // given
    const qb = makeQb();
    qb.getMany.mockResolvedValue([
      makeMockPost('c'),
      makeMockPost('b'),
      makeMockPost('a'),
    ]);

    repo.createQueryBuilder.mockReturnValue(qb);

    // when
    const res = await source.getPosts(true, 'u1', 3, undefined);

    expect(res.posts.map((p) => p.id)).toEqual(['c', 'b', 'a']);
    expect(res.nextCursor).toBeUndefined();
  });
});
