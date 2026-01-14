import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { DevSeedService } from './dev-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [DevSeedService],
})
export class SeedModule {}
