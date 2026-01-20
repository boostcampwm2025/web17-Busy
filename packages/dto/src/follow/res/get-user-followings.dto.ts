import { UserDto } from '../../user/index';

export class GetUserFollowDto {
  users: UserDto[];
  hasNext: boolean;
  nextCursor?: string;
}
