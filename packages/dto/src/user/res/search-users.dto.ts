interface UserDto {
  id: string;
  nickname: string;
  profileImgUrl: string | null;
  isFollowing: boolean;
}

export class SearchUsersResDto {
  users: UserDto[];
}
