import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [join(__dirname, '../../**/*.entity.{ts,js}')],
        synchronize: process.env.NODE_ENV !== 'production',
        timezone: 'Z',

        retryAttempts: 5,
        retryDelay: 2000,

        extra: {
          // 풀 제한 (서버 1개면 5~10 정도로 시작 추천)
          connectionLimit: 5,

          // 연결/응답 지연 시 너무 오래 매달리지 않기
          connectTimeout: 10_000,

          // idle TCP 끊김 방지(핵심)
          enableKeepAlive: true,
          keepAliveInitialDelay: 0,
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class TypeORMInfraModule {}
