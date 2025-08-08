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

    // 設定 Cookie（暫時移除 httpOnly 進行測試）
    response.cookie('auth-token', result.access_token, {
      httpOnly: false, // 暫時設為 false 進行測試
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
      path: '/',
      domain:
        process.env.NODE_ENV === 'production'
          ? '.wuridaostudio.com'
          : 'localhost',
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
