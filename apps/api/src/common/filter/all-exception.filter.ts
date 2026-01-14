// src/common/filters/all-exceptions.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // 모든 예외 캐치
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // 1) HttpException이면 Nest 기본 흐름대로 status 유지
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      // 로그는 선택: 보통 5xx만 찍고 싶으면 조건 걸어도 됨
      if (status >= 500) {
        this.logger.error(
          `HTTP ${status} ${req.method} ${req.originalUrl}`,
          exception.stack,
        );
      }

      return res.status(status).json({
        statusCode: status,
        path: req.originalUrl,
        method: req.method,
        // response가 string일 수도 object일 수도 있어서 그대로 실어줌
        message: response,
        timestamp: new Date().toISOString(),
      });
    }

    // 2) 나머지는 전부 500으로 통일
    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    // 에러 객체면 stack/메시지 로깅
    if (exception instanceof Error) {
      this.logger.error(
        `HTTP 500 ${req.method} ${req.originalUrl} - ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `HTTP 500 ${req.method} ${req.originalUrl} - non-error thrown`,
        JSON.stringify(exception),
      );
    }

    return res.status(status).json({
      statusCode: status,
      path: req.originalUrl,
      method: req.method,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
