import {
  Controller,
  Get,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';

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
