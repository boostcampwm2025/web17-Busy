import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsentHistory } from './privacy.entity';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';
import { PrivacyRepository } from './privacy.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ConsentHistory])],
  controllers: [PrivacyController],
  providers: [PrivacyService, PrivacyRepository],
  exports: [PrivacyService],
})
export class PrivacyModule {}
