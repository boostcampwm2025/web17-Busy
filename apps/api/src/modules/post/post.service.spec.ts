import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { MusicProvider } from '@repo/dto';
import { PostService } from './post.service';
import { PostRepository } from './post.repository';
import { PostMusicRepository } from './post-music.repository';
import { MusicService } from '../music/music.service';
import { Post } from './entities/post.entity';
import { Like } from '../like/entities/like.entity';

const BASE_CREATED_AT = new Date('2026-08-01T00:00:00.000Z');

const mockMusic = (postId: string, index: number) => ({
  id: `${postId}-music-${index}`,
  title: `${postId} track ${index}`,
  artistName: 'VIBR',
  albumCoverUrl: 'https://example.com/album.png',
  trackUri: `itunes:${postId}:${index}`,
  provider: MusicProvider.ITUNES,
  durationMs: 180_000,
});

const mockPost = (index: number): Post => {
  const id = `post-${String(index + 1).padStart(2, '0')}`;
  const createdAt = new Date(BASE_CREATED_AT.getTime() - index * 1000);

  return {
    id,
    author: { id: 'author-1', nickname: 'author', profileImgUrl: null },
    postMusics: [
      { id: `${id}-pm-0`, orderIndex: 0, music: mockMusic(id, 0) },
      { id: `${id}-pm-1`, orderIndex: 1, music: mockMusic(id, 1) },
    ],
    coverImgUrl: 'https://example.com/cover.png',
    content: `content of ${id}`,
    likeCount: 3,
    commentCount: 2,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  } as unknown as Post;
};

const mockPosts = (count: number): Post[] =>
  Array.from({ length: count }, (_, index) => mockPost(index));

describe('PostService', () => {
  let service: PostService;

  const mockPostRepository = {
    getPostsByUser: jest.fn(),
    getFullPostsByUser: jest.fn(),
  };

  const mockPostRepo = {
    findOne: jest.fn(),
  };

  const mockLikeRepo = {
    find: jest.fn(),
    exists: jest.fn(),
  };

  const mockPostMusicRepo = {
    findMusicsByPostId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockLikeRepo.find.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PostRepository, useValue: mockPostRepository },
        { provide: getRepositoryToken(Post), useValue: mockPostRepo },
        { provide: getRepositoryToken(Like), useValue: mockLikeRepo },
        { provide: PostMusicRepository, useValue: mockPostMusicRepo },
        { provide: MusicService, useValue: {} },
        { provide: getDataSourceToken(), useValue: {} },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  describe('getFeedByUserId', () => {
    /**
     * `#372`의 핵심 회귀 테스트.
     * 개선 전에는 목록 조회 1회 + 항목마다 상세 조회가 발생했다.
     * 게시글 수를 늘려도 저장소 호출 수가 늘어나지 않아야 한다.
     */
    it('게시글 수가 늘어나도 저장소 호출 수가 일정하다', async () => {
      const callCountsFor = async (postCount: number) => {
        jest.clearAllMocks();
        mockLikeRepo.find.mockResolvedValue([]);
        mockPostRepository.getFullPostsByUser.mockResolvedValue(
          mockPosts(postCount),
        );

        const result = await service.getFeedByUserId(
          'author-1',
          postCount,
          undefined,
          'viewer-1',
        );

        expect(result.posts).toHaveLength(postCount);

        return {
          list: mockPostRepository.getFullPostsByUser.mock.calls.length,
          like: mockLikeRepo.find.mock.calls.length,
          detail: mockPostRepo.findOne.mock.calls.length,
          musics: mockPostMusicRepo.findMusicsByPostId.mock.calls.length,
        };
      };

      const expected = { list: 1, like: 1, detail: 0, musics: 0 };

      expect(await callCountsFor(12)).toEqual(expected);
      expect(await callCountsFor(30)).toEqual(expected);
    });

    it('로그인하지 않은 요청은 좋아요 조회를 하지 않는다', async () => {
      mockPostRepository.getFullPostsByUser.mockResolvedValue(mockPosts(3));

      const result = await service.getFeedByUserId(
        'author-1',
        3,
        undefined,
        null,
      );

      expect(mockLikeRepo.find).not.toHaveBeenCalled();
      expect(result.posts.map((post) => post.isLiked)).toEqual([
        false,
        false,
        false,
      ]);
    });

    it('일괄 조회한 좋아요 결과를 게시글별로 매핑한다', async () => {
      mockPostRepository.getFullPostsByUser.mockResolvedValue(mockPosts(3));
      mockLikeRepo.find.mockResolvedValue([{ postId: 'post-02' }]);

      const result = await service.getFeedByUserId(
        'author-1',
        3,
        undefined,
        'viewer-1',
      );

      expect(result.posts.map((post) => post.isLiked)).toEqual([
        false,
        true,
        false,
      ]);
    });

    it('상세 조회 응답과 같은 형태로 게시글을 반환한다', async () => {
      mockPostRepository.getFullPostsByUser.mockResolvedValue(mockPosts(1));

      const { posts } = await service.getFeedByUserId(
        'author-1',
        1,
        undefined,
        null,
      );
      const post = posts[0];

      expect(post).toEqual({
        id: 'post-01',
        author: { id: 'author-1', nickname: 'author', profileImgUrl: null },
        coverImgUrl: 'https://example.com/cover.png',
        musics: [mockMusic('post-01', 0), mockMusic('post-01', 1)],
        content: 'content of post-01',
        likeCount: 3,
        commentCount: 2,
        createdAt: BASE_CREATED_AT.toISOString(),
        isEdited: false,
        isLiked: false,
      });
    });

    /**
     * 음악 정렬은 조회 쿼리가 아니라 서비스에서 처리한다.
     * relation 컬럼으로 정렬하면 TypeORM이 `take` 처리용 DISTINCT 서브쿼리에 그 컬럼을 포함시켜
     * LIMIT이 게시글 수가 아니라 join된 행 수에 걸린다.
     */
    it('음악을 orderIndex 순으로 정렬한다', async () => {
      const post = mockPost(0);
      post.postMusics = [
        { id: 'pm-late', orderIndex: 2, music: mockMusic('post-01', 2) },
        { id: 'pm-early', orderIndex: 0, music: mockMusic('post-01', 0) },
        { id: 'pm-mid', orderIndex: 1, music: mockMusic('post-01', 1) },
      ] as unknown as Post['postMusics'];
      mockPostRepository.getFullPostsByUser.mockResolvedValue([post]);

      const { posts } = await service.getFeedByUserId(
        'author-1',
        1,
        undefined,
        null,
      );

      expect(posts[0].musics.map((music) => music.id)).toEqual([
        'post-01-music-0',
        'post-01-music-1',
        'post-01-music-2',
      ]);
    });

    it('limit + 1건을 조회해 다음 페이지 여부와 cursor를 계산한다', async () => {
      mockPostRepository.getFullPostsByUser.mockResolvedValue(mockPosts(3));

      const result = await service.getFeedByUserId(
        'author-1',
        2,
        undefined,
        null,
      );

      expect(mockPostRepository.getFullPostsByUser).toHaveBeenCalledWith(
        'author-1',
        3,
        null,
      );
      expect(result.posts).toHaveLength(2);
      expect(result.hasNext).toBe(true);
      expect(result.nextCursor).toBe(
        `${new Date(BASE_CREATED_AT.getTime() - 1000).toISOString()}_post-02`,
      );
    });

    it('마지막 페이지에서는 cursor를 반환하지 않는다', async () => {
      mockPostRepository.getFullPostsByUser.mockResolvedValue(mockPosts(2));

      const result = await service.getFeedByUserId(
        'author-1',
        2,
        undefined,
        null,
      );

      expect(result.hasNext).toBe(false);
      expect(result.nextCursor).toBeUndefined();
    });

    it('cursor를 날짜로 해석해 저장소에 전달한다', async () => {
      mockPostRepository.getFullPostsByUser.mockResolvedValue([]);

      const cursor = `${BASE_CREATED_AT.toISOString()}_post-01`;
      await service.getFeedByUserId('author-1', 12, cursor, null);

      expect(mockPostRepository.getFullPostsByUser).toHaveBeenCalledWith(
        'author-1',
        13,
        BASE_CREATED_AT,
      );
    });
  });
});
