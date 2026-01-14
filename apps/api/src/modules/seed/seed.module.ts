import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { DevSeedService } from './dev-seed.service';
import { Noti } from '../noti/entities/noti.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Noti])],
  providers: [DevSeedService],
})
export class SeedModule {}
