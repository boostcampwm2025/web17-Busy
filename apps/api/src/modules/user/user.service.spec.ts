import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { NotFoundException } from '@nestjs/common';

// 테스트용 Mock 데이터 생성 헬퍼
const mockUserResult = (overrides = {}) => ({
  id: 'target-user-id',
  nickname: 'TestUser',
  profileImgUrl: 'http://test.com/img.jpg',
  bio: 'Hello World',
  followerCount: 10,
  followingCount: 5,
  isFollowing: '1', // DB에서 문자로 오는 경우 시뮬레이션
  ...overrides,
});

describe('UserService', () => {
  let service: UserService;
  let repository: UserRepository;

  // UserRepository Mock 정의
  const mockUserRepository = {
    findWithFollowInfo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<UserRepository>(UserRepository);

    // 각 테스트 실행 전 Mock 초기화
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserProfile', () => {
    const targetUserId = 'target-user-id';
    const currentUserId = 'my-user-id';

    it('should return user profile with isFollowing true (when logged in and following)', async () => {
      // Given: 리포지토리가 정상적인 유저 데이터를 반환 (isFollowing: '1')
      const dbResult = mockUserResult({ isFollowing: '1' });
      mockUserRepository.findWithFollowInfo.mockResolvedValue(dbResult);

      // When
      const result = await service.getUserProfile(targetUserId, currentUserId);

      // Then
      expect(repository.findWithFollowInfo).toHaveBeenCalledWith(
        targetUserId,
        currentUserId,
      );
      expect(result).toEqual({
        id: dbResult.id,
        nickname: dbResult.nickname,
        profileImgUrl: dbResult.profileImgUrl,
        bio: dbResult.bio,
        followerCount: 10,
        followingCount: 5,
        isFollowing: true, // !!Number('1') -> true 검증
      });
    });

    it('should return isFollowing false (when not following or guest)', async () => {
      // Given: 리포지토리가 isFollowing이 0인 데이터를 반환
      const dbResult = mockUserResult({ isFollowing: '0' });
      mockUserRepository.findWithFollowInfo.mockResolvedValue(dbResult);

      // When: currentUserId 없이 호출 (게스트)
      const result = await service.getUserProfile(targetUserId);

      // Then
      expect(repository.findWithFollowInfo).toHaveBeenCalledWith(
        targetUserId,
        undefined,
      );
      expect(result.isFollowing).toBe(false); // !!Number('0') -> false 검증
    });

    it('should handle null fields correctly (bio, profileImgUrl)', async () => {
      // Given: bio와 profileImgUrl이 null인 데이터
      const dbResult = mockUserResult({
        bio: null,
        profileImgUrl: null,
        isFollowing: undefined, // 로그인 안해서 값이 안 넘어온 경우
      });
      mockUserRepository.findWithFollowInfo.mockResolvedValue(dbResult);

      // When
      const result = await service.getUserProfile(targetUserId);

      // Then
      expect(result.bio).toBe(''); // null -> '' 빈 문자열 변환 확인
      expect(result.profileImgUrl).toBeNull(); // null -> null 유지 확인
      expect(result.isFollowing).toBe(false); // undefined -> false 확인
    });

    it('should throw NotFoundException if user does not exist', async () => {
      // Given: 리포지토리가 null을 반환 (유저 없음)
      mockUserRepository.findWithFollowInfo.mockResolvedValue(null);

      // When & Then
      await expect(
        service.getUserProfile(targetUserId, currentUserId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.getUserProfile(targetUserId, currentUserId),
      ).rejects.toThrow('사용자를 찾을 수 없습니다.');
    });
  });
});
