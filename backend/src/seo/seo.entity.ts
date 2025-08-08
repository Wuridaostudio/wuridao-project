import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('seo_settings')
export class SeoSettings {
  @PrimaryGeneratedColumn()
  id: number;

  // SEO 基本設定
  @Column({ type: 'varchar', length: 100, nullable: true })
  siteTitle: string;

  @Column({ type: 'text', nullable: true })
  siteDescription: string;

  @Column({ type: 'text', nullable: true })
  siteKeywords: string;

  // AEO 設定
  @Column({ type: 'text', nullable: true })
  featuredSnippet: string;

  @Column({ type: 'json', nullable: true })
  faqs: Array<{ question: string; answer: string }>;

  // GEO 設定
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  postalCode: string;

  // 社群媒體設定
  @Column({ type: 'varchar', length: 255, nullable: true })
  facebookUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  instagramUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  youtubeUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
