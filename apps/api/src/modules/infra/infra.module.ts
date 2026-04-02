import { Module } from '@nestjs/common';

import { TypeORMInfraModule } from './typeorm/typeorm.module';
import { RedisInfraModule } from './redis/redis.module';
import { Neo4jInfraModule } from './neo4j/neo4j.module';

@Module({
  imports: [TypeORMInfraModule, RedisInfraModule, Neo4jInfraModule],
})
export class InfraModule {}
