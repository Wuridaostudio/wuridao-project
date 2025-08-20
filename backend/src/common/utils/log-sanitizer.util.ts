// src/common/utils/log-sanitizer.util.ts
export class LogSanitizer {
  /**
   * 脫敏敏感資訊
   */
  static sanitize(data: any): any {
    if (!data) return data;

    // 如果是字串，直接處理
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    // 如果是陣列，遞迴處理每個元素
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    // 如果是物件，遞迴處理每個屬性
    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeValue(key, value);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * 根據鍵名脫敏特定值
   */
  private static sanitizeValue(key: string, value: any): any {
    const lowerKey = key.toLowerCase();

    // 密碼相關欄位
    if (lowerKey.includes('password') || lowerKey.includes('passwd') || lowerKey === 'pwd') {
      return value ? '[REDACTED]' : value;
    }

    // Token 相關欄位
    if (lowerKey.includes('token') || lowerKey.includes('jwt') || lowerKey.includes('auth')) {
      if (typeof value === 'string' && value.length > 10) {
        return `${value.substring(0, 10)}...[REDACTED]`;
      }
      return '[REDACTED]';
    }

    // API 金鑰相關欄位
    if (lowerKey.includes('key') || lowerKey.includes('secret') || lowerKey.includes('api')) {
      if (typeof value === 'string' && value.length > 8) {
        return `${value.substring(0, 8)}...[REDACTED]`;
      }
      return '[REDACTED]';
    }

    // 資料庫連線字串
    if (lowerKey.includes('database') || lowerKey.includes('db') || lowerKey.includes('connection')) {
      if (typeof value === 'string' && value.includes('://')) {
        return '[DATABASE_URL_REDACTED]';
      }
    }

    // 電子郵件地址
    if (lowerKey.includes('email') || lowerKey.includes('mail')) {
      if (typeof value === 'string' && value.includes('@')) {
        const [local, domain] = value.split('@');
        if (local && domain) {
          const maskedLocal = local.length > 2 ? `${local.substring(0, 2)}***` : '***';
          return `${maskedLocal}@${domain}`;
        }
      }
    }

    // 手機號碼
    if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('tel')) {
      if (typeof value === 'string' && value.length > 4) {
        return `${value.substring(0, 4)}****${value.substring(value.length - 2)}`;
      }
    }

    // 信用卡號碼
    if (lowerKey.includes('card') || lowerKey.includes('credit')) {
      if (typeof value === 'string' && value.length > 4) {
        return `****${value.substring(value.length - 4)}`;
      }
    }

    // 遞迴處理物件和陣列
    return this.sanitize(value);
  }

  /**
   * 脫敏字串中的敏感資訊
   */
  private static sanitizeString(str: string): string {
    if (!str) return str;

    // 移除可能的密碼
    str = str.replace(/password["\s]*[:=]["\s]*[^"\s,}]+/gi, 'password: [REDACTED]');
    
    // 移除可能的 token
    str = str.replace(/token["\s]*[:=]["\s]*[^"\s,}]+/gi, 'token: [REDACTED]');
    
    // 移除可能的 API 金鑰
    str = str.replace(/api[_-]?key["\s]*[:=]["\s]*[^"\s,}]+/gi, 'api_key: [REDACTED]');
    
    // 移除可能的資料庫連線字串
    str = str.replace(/postgresql?:\/\/[^"\s]+/gi, '[DATABASE_URL_REDACTED]');
    str = str.replace(/mysql:\/\/[^"\s]+/gi, '[DATABASE_URL_REDACTED]');

    return str;
  }

  /**
   * 安全地記錄物件，移除敏感資訊
   */
  static safeLog(message: string, data?: any): { message: string; data?: any } {
    return {
      message,
      data: data ? this.sanitize(data) : undefined
    };
  }

  /**
   * 檢查是否為生產環境
   */
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * 根據環境決定是否脫敏
   */
  static sanitizeIfProduction(data: any): any {
    return this.isProduction() ? this.sanitize(data) : data;
  }
}
