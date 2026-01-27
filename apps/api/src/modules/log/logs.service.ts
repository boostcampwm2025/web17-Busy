import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateLogsReqDto, LogEventDto } from '@repo/dto';
import { LogEvent } from './entities/log-event.entity';

const safeDateOrNull = (iso?: string): Date | null => {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
};

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(LogEvent)
    private readonly logRepo: Repository<LogEvent>,
  ) {}

  async ingest(userId: string | null, dto: CreateLogsReqDto): Promise<number> {
    const entities = dto.events.map((e: LogEventDto) => {
      return this.logRepo.create({
        eventType: e.eventType,
        source: e.source,

        // createdAt: CreateDateColumn이 DB에서 자동 생성
        occurredAt: safeDateOrNull(e.occurredAt),

        userId,
        sessionId: e.sessionId,
        method: e.method ?? null,
        path: e.path ?? null,
        statusCode: e.statusCode ?? null,
        durationMs: e.durationMs ?? null,
        targetPostId: e.targetPostId ?? null,
        targetUserId: e.targetUserId ?? null,
        provider: e.provider ?? null,
        meta: e.meta ?? null,
      });
    });

    await this.logRepo.save(entities);
    return entities.length;
  }
}
