import type { GetUserDto } from '@repo/dto';

export const MOCK_SEARCH_USERS: GetUserDto[] = [
  {
    id: 'u-1',
    nickname: '사용자A',
    profileImgUrl: null,
    bio: '음악을 좋아합니다',
    followerCount: 1520,
    followingCount: 10,
    isFollowing: false,
  },
  {
    id: 'u-2',
    nickname: '개발자B',
    profileImgUrl: null,
    bio: '힙합/알앤비 위주',
    followerCount: 230,
    followingCount: 80,
    isFollowing: true,
  },
  {
    id: 'u-3',
    nickname: '사운드러버',
    profileImgUrl: null,
    bio: '인디/밴드',
    followerCount: 91234,
    followingCount: 120,
    isFollowing: false,
  },
];
