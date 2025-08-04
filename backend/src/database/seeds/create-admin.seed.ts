// src/database/seeds/create-admin.seed.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../auth/entities/user.entity';

@Injectable()
export class CreateAdminSeed {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async run(): Promise<void> {
    const adminExists = await this.userRepository.findOne({
      where: { username: process.env.ADMIN_USERNAME },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const admin = this.userRepository.create({
        username: process.env.ADMIN_USERNAME,
        password: hashedPassword,
      });
      await this.userRepository.save(admin);
      console.log('✅ Admin user created successfully');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  }
}
