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
  /**
   * 중복 제거용 이벤트 식별자.
   * 전송에 실패해 재시도하면 같은 이벤트가 여러 번 도착할 수 있는데, 하류가 모두 누적 연산이라
   * 중복이 곧 데이터 오염이 된다. 서버는 이 값으로 이미 받은 이벤트를 걸러낸다.
   *
   * 배포 과도기의 옛 번들은 이 값을 보내지 않으므로 optional이다. 없으면 중복 판별 없이 통과한다.
   */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  eventId?: string;

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
