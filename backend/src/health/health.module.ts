import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { StatisticsModule } from '../statistics/statistics.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UnsplashModule } from '../unsplash/unsplash.module';

@Module({
  imports: [StatisticsModule, CloudinaryModule, UnsplashModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
