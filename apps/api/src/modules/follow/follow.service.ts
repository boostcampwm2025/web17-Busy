import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FollowRepository } from './follow.repository';
import { UserService } from '../user/user.service';
import { CreateFollowDto } from '@repo/dto';

@Injectable()
export class FollowService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly followRepository: FollowRepository,
    private readonly userService: UserService,
  ) {}

  async addFollow(userId: string, createFollowDto: CreateFollowDto) {
    const { orderUserId } = createFollowDto;

    // 유저 존재 확인
    const user = await this.userService.findById(orderUserId);
    if (!user) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }
    // 팔로우 상태 확인
    const isFollowd = await this.followRepository.checkIsFollowed(
      userId,
      orderUserId,
    );

    if (isFollowd) {
      throw new ConflictException('이미 팔로우한 유저입니다.');
    }

    await this.followRepository.createFollow(userId, orderUserId);

    return { message: '팔로우 성공' };
  }
}
