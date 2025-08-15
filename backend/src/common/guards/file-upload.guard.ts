// src/common/guards/file-upload.guard.ts
import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class FileUploadGuard implements CanActivate {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/avi'
  ];

  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const file = request.file || request.files;

    if (!file) {
      return true; // 沒有檔案時允許通過
    }

    // 處理單個檔案
    if (request.file) {
      this.validateFile(request.file);
    }

    // 處理多個檔案
    if (request.files) {
      const files = Array.isArray(request.files) ? request.files : Object.values(request.files);
      files.forEach(file => this.validateFile(file));
    }

    return true;
  }

  private validateFile(file: Express.Multer.File): void {
    // 檢查檔案大小
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`檔案大小超過限制 (最大 ${this.maxFileSize / 1024 / 1024}MB)`);
    }

    // 檢查 MIME 類型
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`不支援的檔案類型: ${file.mimetype}`);
    }

    // 檢查檔案名稱安全性
    if (!this.isValidFileName(file.originalname)) {
      throw new BadRequestException('檔案名稱包含不安全的字符');
    }

    // 檢查檔案副檔名
    const extension = this.getFileExtension(file.originalname).toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'avi'];
    
    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException(`不支援的檔案副檔名: ${extension}`);
    }
  }

  private isValidFileName(fileName: string): boolean {
    // 檢查檔案名稱是否包含不安全的字符
    const dangerousPattern = /[<>:"/\\|?*\x00-\x1f]/;
    return !dangerousPattern.test(fileName);
  }

  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop() || '';
  }
}
