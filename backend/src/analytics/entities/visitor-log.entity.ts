// backend/src/analytics/entities/visitor-log.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
@Index(['timestamp', 'country'])
@Index(['ip', 'timestamp'])
export class VisitorLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ip: string;

  @Column()
  page: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  browser: string;

  @Column({ nullable: true })
  os: string;

  @Column({ nullable: true })
  device: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  region: string;

  @Column('float', { nullable: true })
  latitude: number;

  @Column('float', { nullable: true })
  longitude: number;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ default: 0 })
  duration: number; // 停留時間（秒）

  @CreateDateColumn()
  timestamp: Date;
}
