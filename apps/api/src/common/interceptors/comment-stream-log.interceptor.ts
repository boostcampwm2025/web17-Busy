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
export class CommentStreamLogInterceptor implements NestInterceptor {
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

          // 댓글 생성만 인터셉트하는 전제(POST /comment)
          const targetPostId = (req.body as any)?.postId;
          if (!targetPostId) return;

          const content = (req.body as any)?.content;
          const meta =
            typeof content === 'string'
              ? { length: content.length }
              : undefined;

          const userId = getUserIdFromReq(req as any);
          const sessionId = getSessionIdFromReq(req);
          const durationMs = Math.max(0, Date.now() - startedAt);

          const event: LogEventDto = {
            eventType: 'COMMENT_CREATE',
            source: 'be',
            sessionId,
            method: req.method.toUpperCase(),
            path: normalizePathFromReq(req),
            statusCode,
            durationMs,
            targetPostId,
            meta,
          };

          void this.logsService
            .ingest(userId, { events: [event] } as any)
            .catch(() => {});
        },
      }),
    );
  }
}
