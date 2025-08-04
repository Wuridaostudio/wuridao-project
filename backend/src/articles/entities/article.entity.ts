// src/articles/entities/article.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  VersionColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Tag } from '../../tags/entities/tag.entity';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ nullable: true })
  coverImagePublicId: string;

  @Column({ default: false })
  isDraft: boolean;

  @ManyToOne(() => Category, (category) => category.articles)
  category: Category;

  @Column({ nullable: true })
  categoryId: number;

  @ManyToMany(() => Tag, (tag) => tag.articles)
  @JoinTable()
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // SEO 欄位
  @Column({ nullable: true })
  seoTitle: string;

  @Column({ nullable: true })
  seoDescription: string;

  @Column({ nullable: true })
  seoKeywords: string;

  @Column({ nullable: true })
  seoOgImage: string;

  // AEO 欄位
  @Column({ type: 'jsonb', nullable: true })
  aeoFaq: any;

  @Column({ nullable: true })
  aeoFeaturedSnippet: string;

  // GEO 欄位
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  geoLatitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  geoLongitude: number;

  @Column({ nullable: true })
  geoAddress: string;

  @Column({ nullable: true })
  geoCity: string;

  @Column({ nullable: true })
  geoPostalCode: string;

  @VersionColumn()
  version: number;
}
