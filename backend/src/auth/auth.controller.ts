// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Res,
  Logger,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LogSanitizer } from '../common/utils/log-sanitizer.util';

@ApiTags('認證')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: '管理員登入' })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Request() req,
    @Res({ passthrough: true }) response: any,
  ) {
    // ✅ 詳細的登入請求日誌（已脫敏）
    this.logger.log(`🔐 [LOGIN] Starting login request processing`);
    const sanitizedRequestInfo = LogSanitizer.sanitizeIfProduction({
      username: loginDto.username,
      hasPassword: !!loginDto.password,
      passwordLength: loginDto.password?.length,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host,
      environment: process.env.NODE_ENV,
    });
    this.logger.log(`🔐 [LOGIN] Request info:`, sanitizedRequestInfo);

    try {
      // 調用認證服務
      this.logger.log(`🔐 [LOGIN] Calling AuthService.login()`);
      const result = await this.authService.login(loginDto);

      const sanitizedResult = LogSanitizer.sanitizeIfProduction({
        hasToken: !!result.access_token,
        tokenLength: result.access_token?.length,
        hasUser: !!result.user,
        userId: result.user?.id,
        username: result.user?.username,
      });
      this.logger.log(
        `🔐 [LOGIN] AuthService returned result:`,
        sanitizedResult,
      );

      // ✅ [重要] 暫時移除 domain 設定，讓瀏覽器自動處理
      const cookieDomain = undefined; // 讓瀏覽器自動設定 domain

      const sanitizedCookieInfo = LogSanitizer.sanitizeIfProduction({
        cookieDomain,
        environment: process.env.NODE_ENV,
        hasToken: !!result.access_token,
        tokenLength: result.access_token?.length,
      });
      this.logger.log(
        `🍪 [COOKIE] Preparing to set Cookie:`,
        sanitizedCookieInfo,
      );

      const cookieOptions = {
        httpOnly: false, // 允許前端 JavaScript 讀取
        secure: process.env.NODE_ENV === 'production', // 生產環境強制 HTTPS
        sameSite: 'lax' as const, // 防止 CSRF 攻擊
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
        path: '/',
        domain: cookieDomain, // 設置跨域 domain
      };

      const sanitizedCookieOptions =
        LogSanitizer.sanitizeIfProduction(cookieOptions);
      this.logger.log(`🍪 [COOKIE] Cookie options:`, sanitizedCookieOptions);

      // 設置 Cookie
      response.cookie('auth-token', result.access_token, cookieOptions);

      this.logger.log(`🍪 [COOKIE] ✅ Cookie has been set in response`);

      // 記錄響應標頭（已脫敏）
      const sanitizedHeaders = LogSanitizer.sanitizeIfProduction({
        'set-cookie': response.getHeader('Set-Cookie'),
        'access-control-allow-origin': response.getHeader(
          'Access-Control-Allow-Origin',
        ),
        'access-control-allow-credentials': response.getHeader(
          'Access-Control-Allow-Credentials',
        ),
      });
      this.logger.log(`📋 [RESPONSE] Response headers:`, sanitizedHeaders);

      this.logger.log(`✅ [LOGIN] Login successful, returning result`);
      return result;
    } catch (error) {
      const sanitizedError = LogSanitizer.sanitizeIfProduction({
        error: error.message,
        stack: error.stack,
        username: loginDto.username,
        environment: process.env.NODE_ENV,
        errorName: error.name,
        errorType: error.constructor?.name,
      });
      this.logger.error(`❌ [LOGIN] 登入失敗:`, sanitizedError);
      
      // 如果是已知的認證錯誤，保持原樣
      if (error instanceof HttpException) {
        throw error;
      }
      
      // 如果是數據庫連接錯誤或其他未預期錯誤，返回友好的錯誤訊息
      this.logger.error(`❌ [LOGIN] 未預期的錯誤類型:`, {
        errorName: error.name,
        errorMessage: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
      
      // 返回標準化的錯誤響應
      throw new HttpException(
        {
          statusCode: 500,
          message: '登入服務暫時無法使用，請稍後再試',
          error: 'Internal Server Error',
          timestamp: new Date().toISOString(),
          path: '/auth/login',
        },
        500,
      );
    }
  }

  @ApiOperation({ summary: '刷新 Token' })
  @Post('refresh')
  async refreshToken(@Body() body: { refresh_token: string }) {
    this.logger.log(`🔄 [REFRESH] Refresh token request`);
    return this.authService.refreshToken(body.refresh_token);
  }

  @ApiOperation({ summary: '修改密碼' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    this.logger.log(`🔑 [CHANGE_PASSWORD] Change password request:`, {
      userId: req.user?.userId,
      username: req.user?.username,
    });
    return this.authService.changePassword(req.user.userId, changePasswordDto);
  }

  @ApiOperation({ summary: '取得使用者資訊' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    this.logger.log(`👤 [PROFILE] Get user profile:`, {
      userId: req.user?.userId,
      username: req.user?.username,
    });
    // JwtAuthGuard 會將解碼後的使用者 payload 附加到 request 物件上
    return req.user;
  }
}
