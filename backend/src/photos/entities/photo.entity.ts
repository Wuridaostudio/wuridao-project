// src/photos/entities/photo.entity.ts
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

@Entity('photos')
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column({ unique: true, nullable: true })
  publicId: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Category, (category) => category.photos)
  category: Category;

  @Column({ nullable: true })
  categoryId: number;

  @ManyToMany(() => Tag, (tag) => tag.photos, { cascade: true })
  @JoinTable()
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // @VersionColumn()
  // version: number;
}
