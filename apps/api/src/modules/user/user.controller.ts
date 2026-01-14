import {
  Controller,
  Get,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './index';
import { UserId, AuthGuard } from '@/common';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@UserId() userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('사용자를 찾지 못했습니다.');

    return {
      userId: user.id,
      nickname: user.nickname,
      profileImgUrl: user.profileImgUrl,
    };
  }
}
