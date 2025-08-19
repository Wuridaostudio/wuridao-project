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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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
    // ✅ 詳細的登入請求日誌
    this.logger.log(`🔐 [LOGIN] 開始處理登入請求`);
    this.logger.log(`🔐 [LOGIN] 請求資訊:`, {
      username: loginDto.username,
      hasPassword: !!loginDto.password,
      passwordLength: loginDto.password?.length,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host,
      environment: process.env.NODE_ENV,
    });

    try {
      // 調用認證服務
      this.logger.log(`🔐 [LOGIN] 調用 AuthService.login()`);
      const result = await this.authService.login(loginDto);
      
      this.logger.log(`🔐 [LOGIN] AuthService 返回結果:`, {
        hasToken: !!result.access_token,
        tokenLength: result.access_token?.length,
        hasUser: !!result.user,
        userId: result.user?.id,
        username: result.user?.username,
      });

      // ✅ [重要] 設置正確的 Cookie Domain 以支援跨域登入
      const cookieDomain = process.env.NODE_ENV === 'production'
        ? '.onrender.com'  // 支援所有 onrender.com 子域名
        : undefined;       // 開發環境使用預設的 host-only cookie

      this.logger.log(`🍪 [COOKIE] 準備設置 Cookie:`, {
        cookieDomain,
        environment: process.env.NODE_ENV,
        hasToken: !!result.access_token,
        tokenLength: result.access_token?.length,
      });

      const cookieOptions = {
        httpOnly: false, // 允許前端 JavaScript 讀取
        secure: process.env.NODE_ENV === 'production', // 生產環境強制 HTTPS
        sameSite: 'lax' as const, // 防止 CSRF 攻擊
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
        path: '/',
        domain: cookieDomain, // 設置跨域 domain
      };

      this.logger.log(`🍪 [COOKIE] Cookie 選項:`, cookieOptions);

      // 設置 Cookie
      response.cookie('auth-token', result.access_token, cookieOptions);
      
      this.logger.log(`🍪 [COOKIE] ✅ Cookie 已設置到響應中`);

      // 記錄響應標頭
      this.logger.log(`📋 [RESPONSE] 響應標頭:`, {
        'set-cookie': response.getHeader('Set-Cookie'),
        'access-control-allow-origin': response.getHeader('Access-Control-Allow-Origin'),
        'access-control-allow-credentials': response.getHeader('Access-Control-Allow-Credentials'),
      });

      this.logger.log(`✅ [LOGIN] 登入成功，返回結果`);
      return result;

    } catch (error) {
      this.logger.error(`❌ [LOGIN] 登入失敗:`, {
        error: error.message,
        stack: error.stack,
        username: loginDto.username,
        environment: process.env.NODE_ENV,
      });
      throw error;
    }
  }

  @ApiOperation({ summary: '刷新 Token' })
  @Post('refresh')
  async refreshToken(@Body() body: { refresh_token: string }) {
    this.logger.log(`🔄 [REFRESH] 刷新 Token 請求`);
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
    this.logger.log(`🔑 [CHANGE_PASSWORD] 修改密碼請求:`, {
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
    this.logger.log(`👤 [PROFILE] 取得使用者資訊:`, {
      userId: req.user?.userId,
      username: req.user?.username,
    });
    // JwtAuthGuard 會將解碼後的使用者 payload 附加到 request 物件上
    return req.user;
  }
}
