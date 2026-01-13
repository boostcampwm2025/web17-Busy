import { Module } from '@nestjs/common';
import { NotiController } from './noti.controller';
import { NotiService } from './noti.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Noti } from './entities/noti.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Noti])],
  controllers: [NotiController],
  providers: [NotiService],
})
export class NotiModule {}
