import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { LikeRepository } from './like.repository';
import { PostModule } from '../post/post.module';
import { NotiModule } from '../noti/noti.module';
import { LogsModule } from '../log/logs.module';
import { LikeStreamLogInterceptor } from 'src/common/interceptors/like-stream-log.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Like]),
    PostModule,
    NotiModule,
    LogsModule,
  ],
  controllers: [LikeController],
  providers: [LikeService, LikeRepository, LikeStreamLogInterceptor],
  exports: [LikeService, LikeRepository],
})
export class LikeModule {}
