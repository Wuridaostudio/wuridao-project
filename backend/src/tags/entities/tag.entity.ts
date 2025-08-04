// src/tags/entities/tag.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Article } from '../../articles/entities/article.entity';
import { Photo } from '../../photos/entities/photo.entity';
import { Video } from '../../videos/entities/video.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Article, (article) => article.tags)
  articles: Article[];

  @ManyToMany(() => Photo, (photo) => photo.tags)
  photos: Photo[];

  @ManyToMany(() => Video, (video) => video.tags)
  videos: Video[];
}
