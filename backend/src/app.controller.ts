import { Controller, Get, Head, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('應用程式')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '應用程式根端點' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Head()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '健康檢查端點' })
  healthCheck(): void {
    // HEAD請求不需要返回內容，只需要返回200狀態碼
    return;
  }
}
