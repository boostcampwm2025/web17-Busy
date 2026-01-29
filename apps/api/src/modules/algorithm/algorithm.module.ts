import { Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import { AlgorithmService } from './algorithm.service';
import { AlgorithmStreamConsumer } from './algorithm-stream.consumer';

@Module({
  imports: [ConfigModule],
  providers: [
    AlgorithmService,
    AlgorithmStreamConsumer,
    {
      provide: 'NEO4J_DRIVER',
      useFactory: async (configService: ConfigService) => {
        const uri = configService.getOrThrow<string>('NEO4J_URI');
        const username = configService.getOrThrow<string>('NEO4J_USERNAME');
        const password = configService.getOrThrow<string>('NEO4J_PASSWORD');
        return neo4j.driver(uri, neo4j.auth.basic(username, password));
      },
      inject: [ConfigService],
    },
  ],
  exports: [AlgorithmService, AlgorithmStreamConsumer],
})
export class AlgorithmModule implements OnModuleDestroy {
  constructor(@Inject('NEO4J_DRIVER') private readonly driver: Driver) {}

  // 모듈이 종료될 때 드라이버 연결 해제
  async onModuleDestroy() {
    await this.driver.close();
  }
}
