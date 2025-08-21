import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 記錄詳細錯誤資訊
    this.logger.error('Application error', {
      exception: exception,
      stack: exception instanceof Error ? exception.stack : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    // 根據錯誤類型返回適當的狀態碼和訊息
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '系統暫時無法處理您的請求，請稍後再試';
    let errorId = this.generateErrorId();

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      // 處理特定錯誤類型
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        message = '資料驗證失敗';
      } else if (exception.name === 'TypeError') {
        status = HttpStatus.BAD_REQUEST;
        message = '資料格式錯誤';
      } else if (exception.message?.includes('duplicate key')) {
        status = HttpStatus.CONFLICT;
        message = '資料已存在';
      } else if (exception.message?.includes('not found')) {
        status = HttpStatus.NOT_FOUND;
        message = '找不到請求的資源';
      }
    }

    // 在開發環境中提供更詳細的錯誤資訊
    const isDevelopment = process.env.NODE_ENV === 'development';

    const errorResponse = {
      statusCode: status,
      message: message,
      errorId: errorId,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(isDevelopment && {
        stack: exception instanceof Error ? exception.stack : undefined,
        details: exception,
      }),
    };

    response.status(status).json(errorResponse);
  }

  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}





