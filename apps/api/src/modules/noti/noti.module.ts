import { Module } from '@nestjs/common';
import { NotiController, NotiService } from './index';

@Module({
  imports: [],
  controllers: [NotiController],
  providers: [NotiService],
})
export class NotiModule {}
