import { UserDto } from '../../user';

export class LikedUserDto implements UserDto {
  id: string;

  nickname: string;

  profileImgUrl: string | null;
}
