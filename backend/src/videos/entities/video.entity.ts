// src/videos/entities/video.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Tag } from '../../tags/entities/tag.entity';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column({ nullable: true })
  publicId: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @ManyToOne(() => Category, (category) => category.videos)
  category: Category;

  @Column({ nullable: true })
  categoryId: number;

  @ManyToMany(() => Tag, (tag) => tag.videos, { cascade: true })
  @JoinTable()
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
