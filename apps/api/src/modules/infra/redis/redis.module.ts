import { InjectRedis, RedisModule } from '@nestjs-modules/ioredis';
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: `redis://:${config.get<string>('REDIS_PASSWORD')}@${config.get<string>('REDIS_HOST')}:${config.get<string>('REDIS_PORT')}`,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class RedisInfraModule implements OnModuleInit {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async onModuleInit() {
    const pong = await this.redis.ping();
    console.log('[redis] ping:', pong);
  }
}
