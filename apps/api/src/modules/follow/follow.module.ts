import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';
import { Follow } from './entities/follow.entity';
import { FollowRepository } from './follow.repository';
import { NotiModule } from '../noti/noti.module';
import { LogsModule } from '../log/logs.module';

@Module({
  imports: [NotiModule, TypeOrmModule.forFeature([Follow]), LogsModule],
  controllers: [FollowController],
  providers: [FollowService, FollowRepository],
  exports: [FollowService],
})
export class FollowModule {}
