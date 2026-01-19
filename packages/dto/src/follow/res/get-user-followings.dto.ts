import { UserDto } from '../../user/index';

export class GetUserFollowingsDto {
  users: UserDto[];
  hasNext: boolean;
  nextCursor?: string;
}
