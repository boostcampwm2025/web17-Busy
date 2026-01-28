import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';
import type { LogEventDto } from '@repo/dto';

import { LogsService } from 'src/modules/log/logs.service';
import {
  getUserIdFromReq,
  getSessionIdFromReq,
  normalizePathFromReq,
} from './logging.utils';

@Injectable()
export class FollowStreamLogInterceptor implements NestInterceptor {
  constructor(private readonly logsService: LogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = res.statusCode;
          if (statusCode < 200 || statusCode >= 300) return;

          const method = req.method.toUpperCase();

          // FollowController: POST /follow, DELETE /follow (body에 otherUserId)
          const targetUserId = (req.body as any)?.otherUserId;
          if (!targetUserId) return;

          const eventType = method === 'POST' ? 'FOLLOW_ADD' : 'FOLLOW_REMOVE';

          // userId는 필수(로그인 전용 정책). 없으면 스킵(방어)
          const userId = getUserIdFromReq(req as any);
          if (!userId) return;
          const sessionId = getSessionIdFromReq(req);
          const durationMs = Math.max(0, Date.now() - startedAt);

          // sessionId는 있을 때만 포함(사실상 무시 정책 반영)
          const event: LogEventDto = {
            eventType,
            source: 'be',
            ...(sessionId ? { sessionId } : {}),
            method,
            path: normalizePathFromReq(req),
            statusCode,
            durationMs,
            targetUserId,
          };

          void this.logsService
            .ingest(userId, { events: [event] } as any)
            .catch(() => {});
        },
      }),
    );
  }
}
