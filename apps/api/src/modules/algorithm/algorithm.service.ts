import { Injectable, Inject } from '@nestjs/common';
import neo4j, { Driver } from 'neo4j-driver';
import { GraphRelation } from './algorithm-stream.consumer';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';

@Injectable()
export class AlgorithmService {
  constructor(
    @Inject('NEO4J_DRIVER') private readonly driver: Driver,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // 유저 노드 추가
  async createUserNode(userId: string) {
    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (u:User {id: $userId})
          ON CREATE SET u.created_at = datetime()
          `,
          { userId },
        ),
      );
    } finally {
      await session.close();
    }
  }

  // 컨텐츠 노드 추가
  async createContentNode(contentId: string, authorId: string) {
    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (u:User {id: $authorId})
          MERGE (c:Content {id: $contentId})
          ON CREATE SET c.created_at = datetime()
          MERGE (u)-[r:CREATED]->(c)
          SET r.created_at = datetime()
          `,
          { contentId, authorId },
        ),
      );
    } finally {
      await session.close();
    }
  }

  // 관계를 배치로 추가
  async addRelationshipsBatch(batch: GraphRelation[]) {
    if (batch.length === 0) return;

    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $batch AS log
          MERGE (u:User {id: log.userId})

          FOREACH (_ IN CASE WHEN log.targetLabel = 'User' THEN [1] ELSE [] END |
            MERGE (t:User {id: log.targetId})
            MERGE (u)-[r:INTERACTED {type: log.relationType}]->(t)
            ON CREATE SET 
              r.weight = log.weight, 
              r.created_at = datetime(log.props.timestamp),
              r.last_interacted_at = datetime()
            ON MATCH SET 
              r.weight = r.weight + log.weight,
              r.last_interacted_at = datetime()
            SET r += log.props
          )

          FOREACH (_ IN CASE WHEN log.targetLabel = 'Content' THEN [1] ELSE [] END |
            MERGE (t:Content {id: log.targetId})
            MERGE (u)-[r:INTERACTED {type: log.relationType}]->(t)
            ON CREATE SET 
              r.weight = log.weight, 
              r.created_at = datetime(log.props.timestamp),
              r.last_interacted_at = datetime()
            ON MATCH SET 
              r.weight = r.weight + log.weight,
              r.last_interacted_at = datetime()
            SET r += log.props
          )
          `,
          { batch },
        ),
      );
    } finally {
      await session.close();
    }
  }

  // 관계 삭제
  async removeRelationshipsBatch(batch: GraphRelation[]) {
    if (batch.length === 0) return;

    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $batch AS log
          MATCH (u:User {id: log.userId})
          MATCH (u)-[r:INTERACTED {type: log.relationType}]->(t)
          WHERE t.id = log.targetId
          DELETE r
          `,
          { batch },
        ),
      );
    } finally {
      await session.close();
    }
  }

  // neo4j 그룹핑
  async runUnifiedGrouping() {
    const session = this.driver.session();
    try {
      await session.executeWrite(async (tx) => {
        await tx.run(`
          MATCH ()-[r:INTERACTED]-() 
          WHERE r.expired_at < datetime() 
          DELETE r
        `);

        await tx.run(`
          CALL apoc.algo.community(3, ['INTERACTED'], 'partition', 'weight')
          YIELD name
          RETURN count(*)
        `);
      });
    } finally {
      await session.close();
    }
  }

  // 그룹핑 결과 반환 2000배치 skip만큼 이어서
  async fetchGroupingBatch(skip: number = 0, batchSize: number = 2000) {
    const session = this.driver.session();
    try {
      const result = await session.executeRead((tx) =>
        tx.run(
          `
          MATCH (n)
          WHERE n.partition IS NOT NULL
          RETURN n.id AS id, labels(n)[0] AS label, n.partition AS groupId
          ORDER BY n.id
          SKIP $skip
          LIMIT $limit
          `,
          {
            skip: neo4j.int(skip),
            limit: neo4j.int(batchSize),
          },
        ),
      );
      const records = result.records;
      const batch = records.map((r) => ({
        id: r.get('id'),
        label: r.get('label'),
        groupId: r.get('groupId').toString(),
      }));

      // 가져온 데이터가 마지막이면 null or 0 반환
      const nextSkip = records.length === batchSize ? skip + batchSize : null;

      return { batch, nextSkip };
    } finally {
      await session.close();
    }
  }

  // 컨텐츠 아이디 기반 그룹id 탐색
  async getContentGroupIds(contentIds: string[]) {
    const session = this.driver.session();
    try {
      const result = await session.executeRead((tx) =>
        tx.run(
          `
          MATCH (c:Content)
          WHERE c.id IN $contentIds
          RETURN c.id AS contentId, c.partition AS groupId
          `,
          { contentIds },
        ),
      );

      return result.records.map((record) => ({
        contentId: record.get('contentId'),
        groupId: record.get('groupId')?.toString() || 'default',
      }));
    } finally {
      await session.close();
    }
  }

  private async updateGroupInfoToRedis(
    users: { id: string; groupId: string }[],
    posts: { id: string; groupId: string }[],
  ) {
    const pipeline = this.redis.pipeline();

    users.forEach((u) => pipeline.set(REDIS_KEYS.USER_GROUP(u.id), u.groupId));

    posts.forEach((p) => pipeline.set(REDIS_KEYS.POST_GROUP(p.id), p.groupId));

    await pipeline.exec();
  }
}
