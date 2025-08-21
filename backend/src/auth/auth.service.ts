// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {
    this.initializeAdmin(); // 初始化管理員帳號
  }

  // ✅ 登入：比對帳密、簽發 token
  async login(loginDto: LoginDto) {
    this.logger.log(`🔐 [AUTH_SERVICE] Starting login verification`);
    this.logger.log(`🔐 [AUTH_SERVICE] Login info:`, {
      username: loginDto.username,
      hasPassword: !!loginDto.password,
      passwordLength: loginDto.password?.length,
      environment: process.env.NODE_ENV,
    });

    // 查找用戶
    this.logger.log(`🔍 [AUTH_SERVICE] Looking up user: ${loginDto.username}`);
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      // 安全日誌：記錄失敗的登入嘗試
      this.logger.warn(
        `[SECURITY] Failed login attempt for username: ${loginDto.username} - User not found`,
      );
      this.logger.error(`❌ [AUTH_SERVICE] 用戶不存在: ${loginDto.username}`);
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    this.logger.log(`✅ [AUTH_SERVICE] User found:`, {
      userId: user.id,
      username: user.username,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
    });

    // 驗證密碼
    this.logger.log(`🔐 [AUTH_SERVICE] Starting password verification`);
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    this.logger.log(`🔐 [AUTH_SERVICE] Password verification result:`, {
      isPasswordValid,
      providedPasswordLength: loginDto.password?.length,
      storedPasswordLength: user.password?.length,
    });

    if (!isPasswordValid) {
      // 安全日誌：記錄失敗的登入嘗試
      this.logger.warn(
        `[SECURITY] Failed login attempt for username: ${loginDto.username} - Invalid password`,
      );
      this.logger.error(`❌ [AUTH_SERVICE] 密碼驗證失敗: ${loginDto.username}`);
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    // 安全日誌：記錄成功的登入
    this.logger.log(
      `[SECURITY] Successful login for username: ${loginDto.username} (User ID: ${user.id})`,
    );

    // 生成 JWT Token
    this.logger.log(`🎫 [AUTH_SERVICE] Starting JWT Token generation`);
    const payload = { sub: user.id, username: user.username };
    
    this.logger.log(`🎫 [AUTH_SERVICE] JWT Payload:`, {
      sub: payload.sub,
      username: payload.username,
      jwtSecret: process.env.JWT_SECRET ? '已設置' : '未設置',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    const access_token = this.jwtService.sign(payload);
    
    this.logger.log(`🎫 [AUTH_SERVICE] JWT Token generated successfully:`, {
      hasToken: !!access_token,
      tokenLength: access_token?.length,
      tokenPreview: access_token ? `${access_token.substring(0, 20)}...` : 'null',
    });

    this.logger.log(`✅ [AUTH_SERVICE] Login successful, returning result`);
    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        // 不返回密碼等敏感資訊
      },
    };
  }

  // ✅ 刷新 Token
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('用戶不存在');
      }

      const newPayload = { sub: user.id, username: user.username };
      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: this.jwtService.sign(newPayload, { expiresIn: '365d' }),
        user: { id: user.id, username: user.username },
      };
    } catch (error) {
      this.logger.warn(`[SECURITY] Invalid refresh token attempt`);
      throw new UnauthorizedException('無效的刷新令牌');
    }
  }

  // ✅ 驗證用戶（用於 LocalStrategy）
  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // ✅ 修改密碼
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      this.logger.warn(
        `[SECURITY] Password change attempt for non-existent user ID: ${userId}`,
      );
      throw new UnauthorizedException('用戶不存在');
    }

    // 驗證當前密碼
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      // 安全日誌：記錄失敗的密碼修改嘗試
      this.logger.warn(
        `[SECURITY] Failed password change attempt for username: ${user.username} - Invalid current password`,
      );
      throw new UnauthorizedException('當前密碼錯誤');
    }

    // 加密新密碼
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    // 更新密碼
    await this.userRepository.update(userId, {
      password: hashedNewPassword,
    });

    // 安全日誌：記錄成功的密碼修改
    this.logger.log(
      `[SECURITY] Successful password change for username: ${user.username} (User ID: ${userId})`,
    );

    return { message: '密碼修改成功' };
  }

  // ✅ 初始化管理員帳號
  private async initializeAdmin() {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;

    const existingAdmin = await this.userRepository.findOne({
      where: { username: adminUsername },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = this.userRepository.create({
        username: adminUsername,
        password: hashedPassword,
      });
      await this.userRepository.save(admin);
      this.logger.log(`[SECURITY] Admin user created: ${adminUsername}`);
    } else {
      this.logger.log(`[SECURITY] Admin user already exists: ${adminUsername}`);
    }
  }
}
