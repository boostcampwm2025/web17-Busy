import { Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import { AlgorithmService } from './algorithm.service';
import { AlgorithmStreamConsumer } from './algorithm-stream.consumer';

@Module({
  imports: [ConfigModule],
  providers: [AlgorithmService, AlgorithmStreamConsumer],
  exports: [AlgorithmService, AlgorithmStreamConsumer],
})
export class AlgorithmModule {}
