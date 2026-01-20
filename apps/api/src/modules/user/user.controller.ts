import {
  Controller,
  Get,
  Param,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import { UserDto, GetUserDto } from '@repo/dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@UserId() userId: string): Promise<UserDto> {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('사용자를 찾지 못했습니다.');

    const { id, nickname, profileImgUrl } = user;
    return { id, nickname, profileImgUrl };
  }

  @Get(':userId')
  async getUser(
    @Param('userId') targetUserId: string,
    @UserId() userId?: string,
  ): Promise<GetUserDto> {
    const user = await this.userService.getUserProfile(targetUserId, userId);

    return user;
  }
}
