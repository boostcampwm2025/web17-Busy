import { UserDto } from '../../user/index';

export interface UserWithFollowStatusDto extends UserDto {
  isFollowing: boolean;
}

export class GetUserFollowDto {
  users: UserWithFollowStatusDto[];
  hasNext: boolean;
  nextCursor?: string;
}
