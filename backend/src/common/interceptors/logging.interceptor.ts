// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, files, user } = request;
    const now = Date.now();

    // 安全日誌：記錄認證相關請求
    if (url.includes('/auth/') || url.includes('/login')) {
      this.logger.log(`[SECURITY] Authentication request: ${method} ${url}`);
    }

    // 記錄檔案上傳資訊（不包含敏感資訊）
    if (files && Object.keys(files).length > 0) {
      this.logger.log(`📁 File upload request: ${method} ${url}`);
      Object.keys(files).forEach((key) => {
        const file = files[key];
        if (file && file.originalname) {
          this.logger.log(
            `   - File: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
          );
          // 檢查檔案名稱編碼
          const hasSpecialChars = /[^\w\u4e00-\u9fff\s\-\.]/.test(
            file.originalname,
          );
          if (hasSpecialChars) {
            this.logger.warn(
              `   ⚠️  File name contains special characters: ${file.originalname}`,
            );
          }
        }
      });
    }

    // 安全日誌：記錄管理操作（需要認證的請求）
    if (
      user &&
      (method === 'POST' ||
        method === 'PUT' ||
        method === 'PATCH' ||
        method === 'DELETE')
    ) {
      this.logger.log(
        `[SECURITY] Admin operation: ${method} ${url} by user ID: ${user.userId}`,
      );
    }

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const delay = Date.now() - now;
        this.logger.log(`${method} ${url} ${response.statusCode} - ${delay}ms`);
      }),
    );
  }
}
