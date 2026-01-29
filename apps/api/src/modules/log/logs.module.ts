import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { PrivacyModule } from '../privacy/privacy.module';

@Module({
  imports: [PrivacyModule], // PrivacyService 주입을 위해 필요
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService], // 다른 모듈(Like/Comment/Follow)에서 주입 가능
})
export class LogsModule {}
