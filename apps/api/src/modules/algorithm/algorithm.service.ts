import { Injectable, Inject } from '@nestjs/common';
import neo4j, { Session, Driver } from 'neo4j-driver';
import { GraphRelation } from './algorithm-stream.consumer';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';
import { Cron, CronExpression } from '@nestjs/schedule';
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';

interface InteractionRow {
  sourceId: string;
  sourcePartition: number | null;
  targetType: string;
  targetId: string;
  targetPartition: number | null;
  weight: number;
}

interface CommunityUpdate {
  type: 'User' | 'Content';
  id: string;
  groupId: string;
}

@Injectable()
export class AlgorithmService {
  private isGroupingRunning = false;

  constructor(
    @Inject('NEO4J_DRIVER') private readonly driver: Driver,
    @InjectRedis() private readonly redis: Redis,
  ) {}

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

  // neo4j 쿼리를 통해 오래된 관계 삭제 및 노드, 관계 로드
  private async fetchInteractionData(
    session: Session,
  ): Promise<InteractionRow[]> {
    await session.executeWrite((tx) =>
      tx.run(`
        MATCH ()-[r:INTERACTED]-()
        WHERE r.expired_at IS NOT NULL AND r.expired_at < datetime()
        DELETE r
      `),
    );

    const result = await session.executeRead((tx) =>
      tx.run(`
        MATCH (u:User)-[r:INTERACTED]->(t)
        RETURN 
          u.id AS sourceId, 
          u.partition AS sourcePartition, 
          labels(t)[0] AS targetType, 
          t.id AS targetId, 
          t.partition AS targetPartition, 
          r.weight AS weight
      `),
    );

    return result.records.map((record) => ({
      sourceId: record.get('sourceId'),
      sourcePartition: record.get('sourcePartition'),
      targetType: record.get('targetType'),
      targetId: record.get('targetId'),
      targetPartition: record.get('targetPartition'),
      weight: record.get('weight') ?? 1,
    }));
  }

  // 이전 그룹 정보를 통한 가중치 부여, 루벵 연산
  private computeCommunityGroups(rows: InteractionRow[]): CommunityUpdate[] {
    const SAME_COMMUNITY_BONUS = 0.3;
    const graph = new Graph({ type: 'undirected' });

    for (const row of rows) {
      const sourceKey = `user:${row.sourceId}`;
      const targetKey =
        row.targetType === 'User'
          ? `user:${row.targetId}`
          : `content:${row.targetId}`;

      let currentWeight = row.weight;

      // 둘 다 파티션이 존재하고(!null), 서로 같다면 보너스 부여
      if (
        row.sourcePartition != null &&
        row.targetPartition != null &&
        row.sourcePartition === row.targetPartition
      ) {
        currentWeight *= 1 + SAME_COMMUNITY_BONUS;
      }

      // 노드 추가
      if (!graph.hasNode(sourceKey)) {
        graph.addNode(sourceKey, { type: 'User' });
      }
      if (!graph.hasNode(targetKey)) {
        graph.addNode(targetKey, { type: row.targetType });
      }

      // 엣지 추가 또는 업데이트 (가중치 합산)
      if (graph.hasEdge(sourceKey, targetKey)) {
        graph.updateEdgeAttribute(
          sourceKey,
          targetKey,
          'weight',
          (w) => w + currentWeight,
        );
      } else {
        graph.addEdge(sourceKey, targetKey, { weight: currentWeight });
      }
    }

    // 루베인 알고리즘 실행
    const communities = louvain(graph, {
      resolution: 1.0,
      ...({ weightAttribute: 'weight' } as any),
    });

    // 결과 포맷팅
    return Object.entries(communities).map(([nodeKey, groupId]) => {
      const [typePrefix, id] = nodeKey.split(':');
      // typePrefix가 'user'면 'User', 'content'면 'Content' (또는 로직에 맞게 조정)
      const type = typePrefix === 'user' ? 'User' : 'Content';

      return {
        type,
        id,
        groupId: groupId.toString(),
      };
    });
  }

  // 새로운 그룹 neo4j 업데이트
  private async updateCommunityData(
    session: Session,
    updates: CommunityUpdate[],
  ) {
    if (updates.length === 0) return;

    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $updates AS row
        MATCH (n) WHERE labels(n)[0] = row.type AND n.id = row.id
        SET n.partition = row.groupId, n.partition_updated_at = datetime()
        `,
        { updates },
      ),
    );
  }

  // neo4j 그룹핑
  async runUnifiedGrouping() {
    const session = this.driver.session();
    try {
      const rows = await this.fetchInteractionData(session);
      if (rows.length === 0) {
        return;
      }
      const updates = this.computeCommunityGroups(rows);
      await this.updateCommunityData(session, updates);
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

  async syncAllGroupsToRedis() {
    let currentSkip: number | null = 0;

    const users: { id: string; groupId: string }[] = [];
    const posts: { id: string; groupId: string }[] = [];
    while (currentSkip !== null) {
      const { batch, nextSkip } = await this.fetchGroupingBatch(currentSkip);

      if (batch.length === 0) break;
      users.length = 0;
      posts.length = 0;

      batch.forEach((item) => {
        if (item.label === 'User') {
          users.push({ id: item.id, groupId: item.groupId });
        } else {
          posts.push({ id: item.id, groupId: item.groupId });
        }
      });
      await this.updateGroupInfoToRedis(users, posts);
      currentSkip = nextSkip;
    }
  }

  @Cron(CronExpression.EVERY_2_HOURS, { waitForCompletion: true })
  async scheduledGroupingTask() {
    if (this.isGroupingRunning) {
      return;
    }

    this.isGroupingRunning = true;

    try {
      await this.runUnifiedGrouping();
      await this.syncAllGroupsToRedis();
    } catch (error) {
      throw error;
    } finally {
      this.isGroupingRunning = false;
    }
  }
}
