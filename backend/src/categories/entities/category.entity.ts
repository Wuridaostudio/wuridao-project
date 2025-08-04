// src/categories/entities/category.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Article } from '../../articles/entities/article.entity';
import { Video } from '../../videos/entities/video.entity';
import { Photo } from '../../photos/entities/photo.entity';

export enum CategoryType {
  ARTICLE = 'article',
  VIDEO = 'video',
  PHOTO = 'photo',
}

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
    default: CategoryType.ARTICLE,
  })
  type: CategoryType;

  @OneToMany(() => Article, (article) => article.category)
  articles: Article[];

  @OneToMany(() => Video, (video) => video.category)
  videos: Video[];

  @OneToMany(() => Photo, (photo) => photo.category)
  photos: Photo[];
}
