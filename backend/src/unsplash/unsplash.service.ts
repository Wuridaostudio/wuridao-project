// src/unsplash/unsplash.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class UnsplashService {
  private readonly baseUrl = 'https://api.unsplash.com';
  private readonly accessKey = process.env.UNSPLASH_ACCESS_KEY;

  async searchPhotos(query: string, page: number = 1, perPage: number = 20) {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `Client-ID ${this.accessKey}`,
          },
        },
      );

      if (!response.ok) {
        throw new HttpException(
          'Unsplash API 請求失敗',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();

      return {
        results: data.results.map((photo: any) => ({
          id: photo.id,
          urls: {
            small: photo.urls.small,
            regular: photo.urls.regular,
            full: photo.urls.full,
          },
          alt_description: photo.alt_description,
          description: photo.description,
          user: {
            name: photo.user.name,
            username: photo.user.username,
          },
          links: {
            download: photo.links.download,
          },
        })),
        total: data.total,
        total_pages: data.total_pages,
      };
    } catch (error) {
      throw new HttpException(
        '搜尋圖片失敗: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async downloadPhoto(photoId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/photos/${photoId}/download`,
        {
          headers: {
            Authorization: `Client-ID ${this.accessKey}`,
          },
        },
      );

      if (!response.ok) {
        throw new HttpException('無法下載圖片', HttpStatus.BAD_REQUEST);
      }

      const data = await response.json();
      return { downloadUrl: data.url };
    } catch (error) {
      throw new HttpException(
        '下載圖片失敗: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
