import {
  Global,
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import neo4j, { Driver } from 'neo4j-driver';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'NEO4J_DRIVER',
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger(Neo4jInfraModule.name);

        const uri = configService.getOrThrow<string>('NEO4J_URI');
        const username = configService.getOrThrow<string>('NEO4J_USERNAME');
        const password = configService.getOrThrow<string>('NEO4J_PASSWORD');

        const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

        try {
          await driver.verifyConnectivity();
          logger.log('Neo4j connection established');
        } catch (err) {
          logger.error(`Connection error\n${err}\nCause: ${err.cause}`);
        }

        return driver;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['NEO4J_DRIVER'],
})
export class Neo4jInfraModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Neo4jInfraModule.name);

  constructor(@Inject('NEO4J_DRIVER') private readonly driver: Driver) {}

  async onModuleInit() {
    // 모듈 초기화시에 헬스체크
    await this.healthCheck();
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async healthCheck() {
    try {
      await this.driver.verifyConnectivity();
      this.logger.log('neo4j connection is healthy');
    } catch (e) {
      this.logger.error(
        `neo4j connection is not healthy, error: ${e.message}`,
        e.stack,
      );

      // 재연결 로직 필요
    }
  }

  // 모듈이 종료될 때 드라이버 연결 해제
  async onModuleDestroy() {
    await this.driver.close();
  }
}
