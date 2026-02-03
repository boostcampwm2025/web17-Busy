import { FollowingSource } from '../sources/following.source';

describe('FollowingSource (mock only)', () => {
  const postRepository = { createQueryBuilder: jest.fn() };

  const makeQb = () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    return qb;
  };

  const makeMockPost = (id: string) => ({ id }) as any;

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

  it('비로그인 사용자 요청인 경우 myPosts=[], followingPosts=[]', async () => {
    const res = await source.getPosts(true, null, 10, undefined);
    expect(res).toEqual({ posts: [], nextCursor: undefined });
    expect(postRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('팔로잉 쿼리는 innerJoin(follow ...)가 정확히 들어간다', async () => {
    // given
    const qbMy = makeQb();
    const qbFollow = makeQb();

    qbMy.getMany.mockResolvedValue([makeMockPost('c')]);
    qbFollow.getMany.mockResolvedValue([makeMockPost('b')]);

    postRepository.createQueryBuilder
      .mockReturnValueOnce(qbMy)
      .mockReturnValueOnce(qbFollow);

    // when
    await source.getPosts(true, 'u1', 10, undefined);

    // then
    expect(qbFollow.innerJoin).toHaveBeenCalledWith(
      'follow',
      'f',
      'f.followingUserId = :userId AND f.followedUserId = author.id',
      { userId: 'u1' },
    );
  });

  it('cursor가 있으면 쿼리에 andWhere로 커서조건 추가', async () => {
    // given
    const qbMy = makeQb();
    const qbFollow = makeQb();

    qbMy.getMany.mockResolvedValue([]);
    qbFollow.getMany.mockResolvedValue([]);

    postRepository.createQueryBuilder
      .mockReturnValueOnce(qbMy)
      .mockReturnValueOnce(qbFollow);

    // when
    await source.getPosts(true, 'u1', 10, 'CURSOR_ID');

    // then
    expect(qbMy.andWhere).toHaveBeenCalledWith('post.id < :cursor', {
      cursor: 'CURSOR_ID',
    });
    expect(qbFollow.andWhere).toHaveBeenCalledWith('post.id < :cursor', {
      cursor: 'CURSOR_ID',
    });
  });

  it('myPosts 쿼리는 where + like join 조건에 요청 사용자 아이디가 들어간다', async () => {
    // given
    const qbMy = makeQb();
    const qbFollow = makeQb();

    qbMy.getMany.mockResolvedValue([]);
    qbFollow.getMany.mockResolvedValue([]);

    postRepository.createQueryBuilder
      .mockReturnValueOnce(qbMy)
      .mockReturnValueOnce(qbFollow);

    // when
    await source.getPosts(true, 'me', 10, undefined);

    // then
    expect(qbMy.where).toHaveBeenCalledWith('author.id = :myId', {
      myId: 'me',
    });
    expect(qbMy.leftJoinAndSelect).toHaveBeenCalledWith(
      'post.likes',
      'like',
      'like.userId = :myId',
      { myId: 'me' },
    );
  });

  it('두 쿼리 모두 take(limit+1)을 호출한다', async () => {
    // given
    const qbMy = makeQb();
    const qbFollow = makeQb();

    qbMy.getMany.mockResolvedValue([]);
    qbFollow.getMany.mockResolvedValue([]);

    postRepository.createQueryBuilder
      .mockReturnValueOnce(qbMy)
      .mockReturnValueOnce(qbFollow);

    // when
    await source.getPosts(true, 'u1', 7, undefined);

    // then
    expect(qbMy.take).toHaveBeenCalledWith(8);
    expect(qbFollow.take).toHaveBeenCalledWith(8);
  });

  it('myPosts+followingsPosts가 limit보다 많으면 id desc 정렬 후 slice + nextCursor 마지막 id', async () => {
    // given
    const qbMy = makeQb();
    const qbFollow = makeQb();

    qbMy.getMany.mockResolvedValue([makeMockPost('c'), makeMockPost('a')]);
    qbFollow.getMany.mockResolvedValue([makeMockPost('d'), makeMockPost('b')]);

    postRepository.createQueryBuilder
      .mockReturnValueOnce(qbMy)
      .mockReturnValueOnce(qbFollow);

    // when
    const res = await source.getPosts(true, 'u1', 3, undefined);

    // then
    // [c,a,d,b] -> sort desc => [d,c,b,a]
    expect(res.posts.map((p) => p.id)).toEqual(['d', 'c', 'b']);
    expect(res.nextCursor).toBe('b');
  });
});
