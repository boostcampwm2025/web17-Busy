import { Injectable, Inject } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { GraphRelation } from './algorithm-stream.consumer';

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
