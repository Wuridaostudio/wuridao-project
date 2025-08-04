// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateAdminSeed } from './seeds/create-admin.seed';
import { CreateCategoriesSeed } from './seeds/create-categories.seed';
import { CreateTagsSeed } from './seeds/create-tags.seed';
import { User } from '../auth/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Tag } from '../tags/entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Category, Tag])],
  providers: [CreateAdminSeed, CreateCategoriesSeed, CreateTagsSeed],
  exports: [CreateAdminSeed, CreateCategoriesSeed, CreateTagsSeed],
})
export class DatabaseModule {}
// src/common/guards/throttler-behind-proxy.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return (
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      ''
    );
  }
}
