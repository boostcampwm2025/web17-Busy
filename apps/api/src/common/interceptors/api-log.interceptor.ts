import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ApiLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger();

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    // ip, end point, latency, userId
    const req = context.switchToHttp().getRequest<Request>() as Request & {
      user: any;
    };

    const start = Date.now();

    const user = req.user;
    const userId = user?.sub ?? user?.id ?? null;

    // todo
    // 실패 시 에러 스택 트레이스 출력 - 어차피 exception filter에서 출력하니까 여기서는 신경 안 써도 될 듯
    // 상태코드 왜 null 나오지?
    return next.handle().pipe(
      tap(() => {
        const end = Date.now();

        const logPayload = {
          ip: req.ip,
          userId,
          path: req.path,
          method: req.method,
          // status: req.statusCode,
          timestamp: new Date(),
          latency: `${end - start}ms`,
        };

        this.logger.log(`api log - ${JSON.stringify(logPayload, null, 2)}`);
      }),
    );
  }
}
