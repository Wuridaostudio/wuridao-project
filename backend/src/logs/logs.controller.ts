// backend/src/logs/logs.controller.ts
import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

interface FrontendLogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: string;
  component: string;
  environment: string;
  userAgent?: string;
  url?: string;
}

interface BatchLogRequest {
  logs: FrontendLogEntry[];
}

@ApiTags('日誌')
@Controller('logs')
export class LogsController {
  private readonly logger = new Logger(LogsController.name);

  @ApiOperation({ summary: '接收前端單條日誌' })
  @Post('frontend')
  async receiveFrontendLog(@Body() logEntry: FrontendLogEntry) {
    this.logger.log(
      `📱 [前端日誌] [${logEntry.component}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`,
      {
        ...logEntry,
        source: 'frontend',
      },
    );

    return { success: true, message: '日誌已接收' };
  }

  @ApiOperation({ summary: '接收前端批量日誌' })
  @Post('frontend/batch')
  async receiveFrontendLogs(@Body() request: BatchLogRequest) {
    this.logger.log(`📱 [前端批量日誌] 接收 ${request.logs.length} 條日誌`);

    request.logs.forEach((logEntry, index) => {
      this.logger.log(
        `📱 [前端日誌 ${index + 1}] [${logEntry.component}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`,
        {
          ...logEntry,
          source: 'frontend',
          batchIndex: index + 1,
        },
      );
    });

    return {
      success: true,
      message: `已接收 ${request.logs.length} 條日誌`,
      count: request.logs.length,
    };
  }
}
