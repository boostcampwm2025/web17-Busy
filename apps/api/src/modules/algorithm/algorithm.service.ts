import { Injectable, Inject } from '@nestjs/common';
import { Driver } from 'neo4j-driver';

@Injectable()
export class AlgorithmService {
  constructor(@Inject('NEO4J_DRIVER') private readonly driver: Driver) {}

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
  async addRelationshipsBatch(
    batch: { userId: string; targetId: string; actionType: string }[],
  ) {
    if (batch.length === 0) return;

    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $batch AS log
          MERGE (u:User {id: log.userId})

          FOREACH (ignore IN CASE WHEN log.targetLabel = 'User' THEN [1] ELSE [] END |
            MERGE (t:User {id: log.targetId})
            MERGE (u)-[r:INTERACTED {type: log.relationType}]->(t)
            ON CREATE SET r.weight = 1, r.created_at = datetime()
            ON MATCH SET r.weight = r.weight + 1
            SET r.expired_at = datetime() + duration('P30D')
          )

          FOREACH (ignore IN CASE WHEN log.targetLabel = 'Content' THEN [1] ELSE [] END |
            MERGE (t:Content {id: log.targetId})
            MERGE (u)-[r:INTERACTED {type: log.relationType}]->(t)
            ON CREATE SET r.weight = 1, r.created_at = datetime()
            ON MATCH SET r.weight = r.weight + 1
            SET r += log.props, r.expired_at = datetime() + duration('P30D')
          )

          FOREACH (ignore IN CASE WHEN log.targetLabel = 'Music' THEN [1] ELSE [] END |
            MERGE (t:Music {id: log.targetId})
            MERGE (u)-[r:INTERACTED {type: log.relationType}]->(t)
            ON CREATE SET r.weight = 1
            ON MATCH SET r.weight = r.weight + 1
            SET r += log.props, r.expired_at = datetime() + duration('P30D')
          )
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
          CALL apoc.algo.community(3, ['INTERACTED'], 'partition')
          YIELD name
          RETURN count(*)
        `);
      });
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

  // 인터셉터나 서비스에서 로그를 정제하는 로직
  rawLogMapping(rawLogs) {
    const mappedLogs = rawLogs.map((log) => {
      return {
        userId: log.userId,
        targetId: log.targetId,
        // FOLLOW만 User 노드로, 나머지는 Content/Music 노드로 타겟 레이블 지정
        targetLabel:
          log.type === 'FOLLOW' ? 'User' : log.isMusic ? 'Music' : 'Content',
        relationType: log.type, // 'FOLLOW', 'VIEW_DETAIL', 'LISTEN', 'LIKE', 'ADD_PLAYLIST' 등
        props: {
          duration: log.duration || 0, // 청취 시간 등
          count: log.count || 1, // 음악 개수 등
          timestamp: new Date().toISOString(),
        },
      };
    });
  }
}
