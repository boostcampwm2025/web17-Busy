import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { v7 as uuidV7 } from 'uuid';

@Entity({ name: 'log_event' })
@Index('idx_log_event_created_at', ['createdAt'])
@Index('idx_log_event_type_time', ['eventType', 'createdAt'])
@Index('idx_log_event_post_time', ['targetPostId', 'createdAt'])
@Index('idx_log_event_user_time', ['userId', 'createdAt'])
export class LogEvent {
  @PrimaryColumn('char', { name: 'log_event_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidV7();
  }

  @Column('varchar', { name: 'event_type', length: 50 })
  eventType: string;

  @Column('varchar', { name: 'source', length: 10 })
  source: string; // fe_api | fe_ux | be

  /**
   * 서버 적재 시각(UTC): 집계/추천/인기글 기준 시간
   * - DB가 CURRENT_TIMESTAMP(6)로 생성
   */
  @CreateDateColumn({
    name: 'created_at',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  /**
   * 클라이언트 발생 시각 (nullable)
   * - 시간 이슈 방지를 위해 집계 기준으로 사용하지 않음(참고/디버그용)
   */
  @Column('datetime', {
    name: 'occurred_at',
    precision: 6,
    nullable: true,
    default: null,
  })
  occurredAt: Date | null;

  @Column('char', { name: 'user_id', length: 36, nullable: true })
  userId: string | null;

  @Column('varchar', { name: 'session_id', length: 64 })
  sessionId: string;

  @Column('varchar', { name: 'method', length: 8, nullable: true })
  method?: string | null;

  @Column('varchar', { name: 'path', length: 255, nullable: true })
  path?: string | null;

  @Column('int', { name: 'status_code', nullable: true })
  statusCode?: number | null;

  @Column('int', { name: 'duration_ms', nullable: true })
  durationMs?: number | null;

  @Column('char', { name: 'target_post_id', length: 36, nullable: true })
  targetPostId?: string | null;

  @Column('char', { name: 'target_user_id', length: 36, nullable: true })
  targetUserId?: string | null;

  @Column('varchar', { name: 'provider', length: 20, nullable: true })
  provider?: string | null;

  @Column('json', { name: 'meta', nullable: true })
  meta?: Record<string, unknown> | null;
}
