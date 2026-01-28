import {
  Controller,
  Get,
  Param,
  Query,
  UnauthorizedException,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  Patch,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AuthOptionalGuard } from 'src/common/guards/auth.optional-guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import {
  UserDto,
  GetUserDto,
  SearchUsersResDto,
  UpdateProfileDto,
} from '@repo/dto';

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

  @UseGuards(AuthOptionalGuard)
  @Get('search')
  async searchUsers(
    @Query('q') keyword: string,
    @UserId() userId?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('cursor') cursor?: string,
  ): Promise<SearchUsersResDto> {
    const users = await this.userService.searchUsers(
      keyword,
      limit,
      cursor,
      userId,
    );

    return users;
  }

  @UseGuards(AuthOptionalGuard)
  @Get(':userId')
  async getUser(
    @Param('userId') targetUserId: string,
    @UserId() userId?: string,
  ): Promise<GetUserDto | undefined> {
    const user = await this.userService.getUserProfile(targetUserId, userId);

    return user;
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch()
  async profileUpdate(
    @UserId() userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return await this.userService.updateUser(userId, updateProfileDto);
  }
}
