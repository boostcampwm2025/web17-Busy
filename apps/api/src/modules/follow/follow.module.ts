import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';
import { Follow } from './entities/follow.entity';
import { FollowRepository } from './follow.repository';
import { NotiModule } from '../noti/noti.module';
import { LogsModule } from '../log/logs.module';
import { FollowStreamLogInterceptor } from 'src/common/interceptors/follow-stream-log.interceptor';

@Module({
  imports: [NotiModule, TypeOrmModule.forFeature([Follow]), LogsModule],
  controllers: [FollowController],
  providers: [FollowService, FollowRepository, FollowStreamLogInterceptor],
  exports: [FollowService],
})
export class FollowModule {}
