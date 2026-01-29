import { Type } from 'class-transformer';
import { IsArray, IsISO8601, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export const LOG_SOURCES = ['fe_api', 'fe_ux', 'be'] as const;
export type LogSource = (typeof LOG_SOURCES)[number];

/**
 * NOTE:
 * - occurredAt은 "클라이언트 발생 시각" (nullable)
 * - createdAt(서버 적재 시각)은 DB에서 자동 생성되므로 DTO로 받지 않음
 */
export class LogEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  eventType: string;

  @IsIn(LOG_SOURCES)
  source: LogSource;

  /** 클라이언트 발생 시각(선택). 집계/추천 기준은 created_at(서버 적재 시각) */
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  method?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  path?: string;

  @IsOptional()
  @IsInt()
  statusCode?: number;

  @IsOptional()
  @IsInt()
  durationMs?: number;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  targetPostId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  targetUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  provider?: string; // ITUNES / YOUTUBE 등

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

export class CreateLogsReqDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogEventDto)
  events: LogEventDto[];
}

export class CreateLogsResDto {
  ok: true;
  accepted: number;
}
