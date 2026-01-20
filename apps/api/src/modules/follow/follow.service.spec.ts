import { Test, TestingModule } from '@nestjs/testing';
import { FollowService } from './follow.service';
import { FollowRepository } from './follow.repository';
import { DataSource } from 'typeorm';
import { CreateFollowDto, DeleteFollowDto } from '@repo/dto';

// Mock용 데이터 생성 헬퍼
const mockUser = (id: string, name: string) => ({
  id,
  name,
  email: `${name}@test.com`,
  // 필요한 UserDto 필드들 추가
});

const mockFollow = (
  id: string,
  followerId: string,
  followingId: string,
  createdAt: Date,
) => ({
  id,
  userId: followerId,
  followingUserId: followingId, // 내가 팔로우 하는 사람
  createdAt,
  followedUser: mockUser(followingId, 'FollowingUser'), // getFollowings용 (내가 팔로우한 사람 정보)
  followingUser: mockUser(followerId, 'FollowerUser'), // getFollowers용 (나를 팔로우한 사람 정보)
});

describe('FollowService', () => {
  let service: FollowService;
  let repository: FollowRepository;

  // Repository Mock 정의
  const mockFollowRepository = {
    createFollow: jest.fn(),
    removeFollow: jest.fn(),
    getFollowings: jest.fn(),
    getFollowers: jest.fn(),
  };

  // DataSource Mock 정의 (Service 생성자에서 요구하므로)
  const mockDataSource = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowService,
        { provide: FollowRepository, useValue: mockFollowRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<FollowService>(FollowService);
    repository = module.get<FollowRepository>(FollowRepository);

    // 각 테스트 실행 전 Mock 초기화
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addFollow', () => {
    it('should call repository.createFollow and return success message', async () => {
      const userId = 'user-1';
      const dto: CreateFollowDto = { otherUserId: 'user-2' };

      mockFollowRepository.createFollow.mockResolvedValue(undefined);

      const result = await service.addFollow(userId, dto);

      expect(repository.createFollow).toHaveBeenCalledWith(
        userId,
        dto.otherUserId,
      );
      expect(result).toEqual({ message: '팔로우 성공' });
    });
  });

  describe('removeFollow', () => {
    it('should call repository.removeFollow and return success message', async () => {
      const userId = 'user-1';
      const dto: DeleteFollowDto = { otherUserId: 'user-2' };

      mockFollowRepository.removeFollow.mockResolvedValue(undefined);

      const result = await service.removeFollow(userId, dto);

      expect(repository.removeFollow).toHaveBeenCalledWith(
        userId,
        dto.otherUserId,
      );
      expect(result).toEqual({ message: '팔로우 해제 성공' });
    });
  });

  describe('getFollowings', () => {
    const userId = 'my-id';
    const limit = 2;

    it('should return paginated follows without cursor (First Page)', async () => {
      // limit(2) + 1 = 3개의 데이터를 리턴한다고 가정 (hasNext 테스트용)
      const now = new Date();
      const follows = [
        mockFollow('f1', userId, 'u1', now),
        mockFollow('f2', userId, 'u2', now),
        mockFollow('f3', userId, 'u3', now), // Extra item
      ];

      mockFollowRepository.getFollowings.mockResolvedValue(follows);

      const result = await service.getFollowings(userId, limit);

      // 1. Repository 호출 검증 (limit + 1 전달 확인)
      expect(repository.getFollowings).toHaveBeenCalledWith(
        userId,
        limit + 1,
        null,
      );

      // 2. hasNext 확인
      expect(result.hasNext).toBe(true);

      // 3. 실제 데이터는 limit 개수만큼만 잘려서 와야 함
      expect(result.users).toHaveLength(limit);
      expect(result.users[0].id).toBe('u1'); // followedUser가 매핑되었는지 확인

      // 4. nextCursor 확인 (마지막 아이템의 createdAt)
      expect(result.nextCursor).toBe(follows[1].createdAt.toISOString());
    });

    it('should return paginated follows with cursor', async () => {
      const cursorDate = new Date('2024-01-01');
      const cursor = cursorDate.toISOString();
      const follows = [mockFollow('f1', userId, 'u1', cursorDate)];

      mockFollowRepository.getFollowings.mockResolvedValue(follows);

      await service.getFollowings(userId, limit, cursor);

      // 커서 디코딩 후 Repository에 Date 객체로 전달되는지 확인
      expect(repository.getFollowings).toHaveBeenCalledWith(
        userId,
        limit + 1,
        expect.any(Date), // Date 객체인지 확인
      );
    });

    it('should handle last page (hasNext: false)', async () => {
      const follows = [mockFollow('f1', userId, 'u1', new Date())]; // limit(2)보다 적음

      mockFollowRepository.getFollowings.mockResolvedValue(follows);

      const result = await service.getFollowings(userId, limit);

      expect(result.hasNext).toBe(false);
      expect(result.nextCursor).toBeUndefined();
      expect(result.users).toHaveLength(1);
    });
  });

  describe('getFollowers', () => {
    const userId = 'my-id';
    const limit = 2;

    it('should return paginated followers correctly (Composite Cursor)', async () => {
      const now = new Date();
      // 팔로워 목록: 나를 팔로우 하는 사람들
      const follows = [
        mockFollow('f1', 'u1', userId, now),
        mockFollow('f2', 'u2', userId, now),
        mockFollow('f3', 'u3', userId, now),
      ];

      mockFollowRepository.getFollowers.mockResolvedValue(follows);

      const result = await service.getFollowers(userId, limit);

      expect(repository.getFollowers).toHaveBeenCalledWith(
        userId,
        limit + 1,
        null,
        null,
      );

      expect(result.hasNext).toBe(true);
      expect(result.users[0].id).toBe('u1'); // followingUser가 매핑되었는지 확인

      // **중요**: getFollowers는 커서가 "Date_ID" 형태여야 함
      const expectedCursor = `${follows[1].createdAt.toISOString()}_${follows[1].followingUserId}`;
      expect(result.nextCursor).toBe(expectedCursor);
    });

    it('should decode composite cursor correctly', async () => {
      const dateStr = '2024-01-01T00:00:00.000Z';
      const lastId = 'last-user-id';
      const cursor = `${dateStr}_${lastId}`;

      mockFollowRepository.getFollowers.mockResolvedValue([]);

      await service.getFollowers(userId, limit, cursor);

      // decodeCursor 로직 검증
      expect(repository.getFollowers).toHaveBeenCalledWith(
        userId,
        limit + 1,
        new Date(dateStr), // 날짜 파싱 확인
        lastId, // ID 파싱 확인
      );
    });
  });
});
