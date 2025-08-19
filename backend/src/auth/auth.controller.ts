// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('認證')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: '管理員登入' })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: any,
  ) {
    const result = await this.authService.login(loginDto);

    // ✅ [重要] 設置正確的 Cookie Domain 以支援跨域登入
    const cookieDomain = process.env.NODE_ENV === 'production'
      ? '.onrender.com'  // 支援所有 onrender.com 子域名
      : undefined;       // 開發環境使用預設的 host-only cookie

    response.cookie('auth-token', result.access_token, {
      httpOnly: false, // 允許前端 JavaScript 讀取
      secure: process.env.NODE_ENV === 'production', // 生產環境強制 HTTPS
      sameSite: 'lax', // 防止 CSRF 攻擊
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
      path: '/',
      domain: cookieDomain, // 設置跨域 domain
    });

    return result;
  }

  @ApiOperation({ summary: '刷新 Token' })
  @Post('refresh')
  async refreshToken(@Body() body: { refresh_token: string }) {
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
    return this.authService.changePassword(req.user.userId, changePasswordDto);
  }

  @ApiOperation({ summary: '取得使用者資訊' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    // JwtAuthGuard 會將解碼後的使用者 payload 附加到 request 物件上
    return req.user;
  }
}
