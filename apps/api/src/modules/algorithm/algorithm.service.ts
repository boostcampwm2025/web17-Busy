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
          
          FOREACH (ignore IN CASE WHEN log.actionType = 'FOLLOW' THEN [1] ELSE [] END |
            MERGE (t:User {id: log.targetId})
            MERGE (u)-[r:INTERACTED {type: 'FOLLOW'}]->(t)
            ON CREATE SET r.created_at = datetime(), r.expired_at = datetime() + duration('P30D'), r.weight = 1
            ON MATCH SET r.last_interacted_at = datetime(), r.expired_at = datetime() + duration('P30D'), r.weight = r.weight + 1
          )
          
          FOREACH (ignore IN CASE WHEN log.actionType <> 'FOLLOW' THEN [1] ELSE [] END |
            MERGE (t:Content {id: log.targetId})
            MERGE (u)-[r:INTERACTED {type: log.actionType}]->(t)
            ON CREATE SET r.created_at = datetime(), r.expired_at = datetime() + duration('P30D'), r.weight = 1
            ON MATCH SET r.last_interacted_at = datetime(), r.expired_at = datetime() + duration('P30D'), r.weight = r.weight + 1
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
}
