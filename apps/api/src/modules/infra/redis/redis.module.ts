import { InjectRedis, RedisModule } from '@nestjs-modules/ioredis';
import { Logger, Module, OnModuleInit } from '@nestjs/common';
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
  private readonly logger = new Logger(RedisInfraModule.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async onModuleInit() {
    // 헬스체크
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') throw new Error();

      this.logger.log('redis is ready');
    } catch (e) {
      this.logger.error('fail to ping redis', e);
    }

    // redis 이벤트 별로 이벤트 핸들러 등록
    this.redis.on('connect', () => {
      this.logger.log('redis connected');
    });

    this.redis.on('ready', () => {
      this.logger.log('redis ready');
    });

    this.redis.on('error', (err) => {
      this.logger.error(`redis error: ${err.message}`, err.stack);
    });

    this.redis.on('close', () => {
      this.logger.warn('redis close');
    });

    this.redis.on('reconnecting', (delay: number) => {
      this.logger.warn(`redis reconnecting after ${delay}ms`);
    });

    this.redis.on('end', () => {
      this.logger.warn('redis end');
    });

    this.redis.on('wait', () => {
      this.logger.debug('redis wait');
    });
  }
}
