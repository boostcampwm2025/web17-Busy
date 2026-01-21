export interface SearchUserDto {
  id: string;
  nickname: string;
  profileImgUrl: string | null;
  isFollowing: boolean;
}

export class SearchUsersResDto {
  users: SearchUserDto[];
  hasNext: boolean;
  nextCursor?: string;
}
