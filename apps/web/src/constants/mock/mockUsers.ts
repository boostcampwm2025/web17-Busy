import type { SearchUsersResDto } from '@repo/dto';

type SearchUser = SearchUsersResDto['users'][number];

const makeMockUsers = (count: number): SearchUser[] => {
  const out: SearchUser[] = [];

  for (let i = 1; i <= count; i += 1) {
    out.push({
      id: `mock-user-${i}`,
      nickname: `사용자${i}`,
      profileImgUrl: null,
      isFollowing: i % 7 === 0,
    });
  }

  out.push(
    { id: 'u-kr-1', nickname: '사용자A', profileImgUrl: null, isFollowing: false },
    { id: 'u-kr-2', nickname: '개발자B', profileImgUrl: null, isFollowing: true },
    { id: 'u-kr-3', nickname: '사운드러버', profileImgUrl: null, isFollowing: false },
  );

  return out;
};

export const MOCK_SEARCH_USERS: SearchUser[] = makeMockUsers(60);
