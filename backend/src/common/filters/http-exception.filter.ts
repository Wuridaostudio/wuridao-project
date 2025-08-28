// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import * as Sentry from '@sentry/node';
import { LogSanitizer } from '../utils/log-sanitizer.util';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // 新增：log 驗證錯誤詳細內容
    try {
      const detail = exception.getResponse();
      // 只在 400 時印出詳細內容
      if (status === 400) {
        // 若是物件或陣列，格式化印出
        if (typeof detail === 'object') {
          this.logger.error(
            '[Validation Error]',
            JSON.stringify(detail, null, 2),
          );
        } else {
          this.logger.error('[Validation Error]', detail);
        }
      }
    } catch (e) {}

    // 統一錯誤回應格式，移除敏感資訊
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      // 讓 message 支援陣列或物件
      message:
        typeof exception.getResponse() === 'object' &&
        (exception.getResponse() as any).message
          ? (exception.getResponse() as any).message
          : exception.message || 'Internal server error',
      // 只在開發環境顯示詳細錯誤資訊
      ...(process.env.NODE_ENV === 'development' && {
        stack: LogSanitizer.sanitize(exception.stack),
        details: LogSanitizer.sanitize(exception.getResponse()),
      }),
    };

    // 記錄已脫敏的錯誤日誌
    const sanitizedErrorInfo = LogSanitizer.sanitizeIfProduction({
      method: request.method,
      url: request.url,
      status,
      message: exception.message,
      stack: exception.stack,
      response: exception.getResponse(),
    });

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${exception.message}`,
      sanitizedErrorInfo,
    );
    Sentry.captureException(exception);

    response.status(status).json(errorResponse);
  }
}
