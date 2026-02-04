import { Test } from '@nestjs/testing';
import { FeedService } from '../feed.service';
import { FollowingSource } from '../sources/following.source';
import { TrendingSource } from '../sources/trending.source';
import { RecentSource } from '../sources/recent.source';
import { SourceAllocationPolicy } from '../policy/source-allocation.policy';
import { FeedCompositionPolicy } from '../policy/feed-composition.policy';

describe('FeedService', () => {
  let service: FeedService;

  const followingSource = {
    getPosts: jest.fn(),
  };
  const trendingSource = {
    getPosts: jest.fn(),
  };
  const recentSource = {
    getPosts: jest.fn(),
  };
  const sourceAllocationPolicy = {
    allocate: jest.fn(),
  };
  const feedCompositionPolicy = {
    compose: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: FollowingSource, useValue: followingSource },
        { provide: TrendingSource, useValue: trendingSource },
        { provide: RecentSource, useValue: recentSource },
        { provide: SourceAllocationPolicy, useValue: sourceAllocationPolicy },
        { provide: FeedCompositionPolicy, useValue: feedCompositionPolicy },
      ],
    }).compile();

    service = moduleRef.get(FeedService);
  });

  const makePost = (overrides: Partial<any> = {}) => {
    const base = {
      id: 'post-1',
      content: 'c',
      coverImgUrl: null,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      author: { id: 'u1', nickname: 'n', profileImgUrl: null },
      likes: [],
      postMusics: [
        {
          music: {
            id: 'm1',
            title: 't',
            artistName: 'a',
            albumCoverUrl: 'img',
            trackUri: 'uri',
            provider: 'itunes',
            durationMs: 123000,
          },
        },
      ],
    };
    return { ...base, ...overrides };
  };

  it('초기 요청: cursor 없으면 isInitialRequest=true로 소스 호출', async () => {
    // given
    const followingLimit = 2;
    const trendingLimit = 3;
    const recentLimit = 5;

    sourceAllocationPolicy.allocate.mockReturnValue({
      followingLimit,
      trendingLimit,
      recentLimit,
    });

    followingSource.getPosts.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });
    trendingSource.getPosts.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });
    recentSource.getPosts.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });

    feedCompositionPolicy.compose.mockReturnValue([]);

    // when
    await service.feed('u1', 10);

    // then
    expect(followingSource.getPosts).toHaveBeenCalledWith(
      true,
      'u1',
      followingLimit,
      undefined,
    );
    expect(trendingSource.getPosts).toHaveBeenCalledWith(
      true,
      'u1',
      trendingLimit,
      undefined,
    );
    expect(recentSource.getPosts).toHaveBeenCalledWith(
      true,
      'u1',
      followingLimit + recentLimit,
      undefined,
    );
  });

  it('초기 이후 요청: cursor 일부라도 있으면 isInitialRequest=false', async () => {
    // given
    const followingLimit = 2;
    const trendingLimit = 3;
    const recentLimit = 5;

    sourceAllocationPolicy.allocate.mockReturnValue({
      followingLimit,
      trendingLimit,
      recentLimit,
    });

    followingSource.getPosts.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });
    trendingSource.getPosts.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });
    recentSource.getPosts.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });

    feedCompositionPolicy.compose.mockReturnValue([]);

    // when
    await service.feed('u1', 3, { following: 'f1' });

    // then
    expect(followingSource.getPosts).toHaveBeenCalledWith(
      false,
      'u1',
      followingLimit,
      'f1',
    );
    expect(trendingSource.getPosts).toHaveBeenCalledWith(
      false,
      'u1',
      trendingLimit,
      undefined,
    );
    expect(recentSource.getPosts).toHaveBeenCalledWith(
      false,
      'u1',
      followingLimit + recentLimit,
      undefined,
    );
  });

  it('compose에 3 소스 결과를 그대로 넘기고, compose 결과를 posts로 리턴한다', async () => {
    const followingLimit = 2;
    const trendingLimit = 3;
    const recentLimit = 5;

    sourceAllocationPolicy.allocate.mockReturnValue({
      followingLimit,
      trendingLimit,
      recentLimit,
    });

    const followingPosts = [makePost({ id: 'f' })];
    const trendingPosts = [makePost({ id: 't' })];
    const recentPosts = [makePost({ id: 'r' })];

    followingSource.getPosts.mockResolvedValue({
      posts: followingPosts,
      nextCursor: undefined,
    });
    trendingSource.getPosts.mockResolvedValue({
      posts: trendingPosts,
      nextCursor: undefined,
    });
    recentSource.getPosts.mockResolvedValue({
      posts: recentPosts,
      nextCursor: undefined,
    });

    const composed = [makePost({ id: 'c1' }), makePost({ id: 'c2' })];
    feedCompositionPolicy.compose.mockReturnValue(composed);

    const res = await service.feed('u1', 3);

    expect(feedCompositionPolicy.compose).toHaveBeenCalledWith(
      followingPosts,
      trendingPosts,
      recentPosts,
    );
    expect(res.posts).toHaveLength(2);
    expect(res.posts.map((p) => p.id)).toEqual(['c1', 'c2']);
  });

  it('hasNext/nextCursor는 각 소스의 nextCursor OR 로 결정', async () => {
    // given
    sourceAllocationPolicy.allocate.mockReturnValue({
      followingLimit: 0,
      trendingLimit: 0,
      recentLimit: 0,
    });

    followingSource.getPosts.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });
    trendingSource.getPosts.mockResolvedValue({ posts: [], nextCursor: 'tc' });
    recentSource.getPosts.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });

    feedCompositionPolicy.compose.mockReturnValue([]);

    // when
    const res = await service.feed(null, 0);

    expect(res.hasNext).toBe(true);
    expect(res.nextCursor).toEqual({
      following: undefined,
      trending: 'tc',
      recent: undefined,
    });
  });

  it('mapToFeedResponseDto: isLiked/isEdited/musics 매핑', async () => {
    // given
    sourceAllocationPolicy.allocate.mockReturnValue({
      followingLimit: 1,
      trendingLimit: 0,
      recentLimit: 0,
    });

    const p = makePost({
      id: 'p1',
      likes: [{ userId: 'u1' }], // join 결과 있다고 가정
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-01T00:00:01.000Z'), // 정확히 1000ms
    });

    followingSource.getPosts.mockResolvedValue({
      posts: [p],
      nextCursor: undefined,
    });
    trendingSource.getPosts.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });
    recentSource.getPosts.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });

    feedCompositionPolicy.compose.mockReturnValue([p]);

    // when
    const res = await service.feed('u1', 1);

    // then
    expect(res.posts[0].isLiked).toBe(true);
    expect(res.posts[0].isEdited).toBe(true);
    expect(res.posts[0].musics[0].title).toBe('t');
  });
});
