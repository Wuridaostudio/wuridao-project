# 檔案上傳與生命週期管理最終架構規範 (Final Architecture & Rules)

**文件版本**: 1.0
**審核者**: Gemini (Senior Reviewer)
**狀態**: **已批准 (Approved & Finalized)**

## 1. 概述 (Overview)

本文件定義了在我們的 NestJS 應用程式中，處理涉及外部儲存服務 (Cloudinary) 的檔案上傳、更新和刪除操作的最終架un構和不可違抗的規則。此設計旨在確保**資料一致性**、**系統穩健性**、**高效能**和**併發安全**。

過去的實作存在狀態不一致、長交易和競爭條件的風險。此規範將透過**嚴格的操作順序**和**明確的職責分離**來解決這些問題。

## 2. 核心設計原則 (Core Principles)

1.  **資料庫優先 (Database as the Source of Truth)**：系統的狀態以資料庫中的紀錄為唯一標準。外部儲存（Cloudinary）應被視為資料庫紀錄的附屬品。
2.  **操作順序決定成敗 (Order of Operations is Critical)**：
    *   **寫入操作 (Create/Update)**：**先上傳，後儲存，再清理**。`Upload -> Save -> Cleanup`。
    *   **刪除操作 (Delete)**：**先刪除紀錄，後清理檔案**。`Delete Record -> Cleanup File`。
3.  **短交易生命週期 (Short-Lived Transactions)**：避免在交易中包含長時間執行的網路 I/O 操作（如檔案上傳）。
4.  **併發安全 (Concurrency Safety)**：所有參與此類操作的實體必須使用樂觀鎖來防止更新遺失。
5.  **故障隔離 (Failure Isolation)**：核心業務流程的成功不應依賴於次要的清理操作。清理失敗應被記錄並可由後續機制補救。

## 3. 不可違抗的規則 (The Golden Rules)

**所有團隊成員在開發相關功能時，必須無條件遵守以下規則。任何偏離都必須經過架構團隊的正式審核。**

*   **規則 #1：嚴格遵守操作順序**
    *   **建立 (Create)**:
        1.  `await cloudinary.upload()`
        2.  `await database.save()`
        3.  如果 `database.save()` 失敗，**必須** `await cloudinary.delete()` 來清理孤兒檔案。
    *   **更新 (Update)**:
        1.  `await cloudinary.upload()` (上傳新檔案)
        2.  `await database.save()` (儲存包含新 `public_id` 的紀錄)
        3.  如果 `database.save()` 成功，**才可** `await cloudinary.delete()` (清理舊檔案)。
        4.  如果 `database.save()` 失敗，**必須** `await cloudinary.delete()` (清理剛上傳的新檔案)。
    *   **刪除 (Delete)**:
        1.  `await database.delete()`
        2.  如果 `database.delete()` 成功，**才可** `await cloudinary.delete()`。

*   **規則 #2：禁止在資料庫交易中執行檔案上傳**
    *   嚴禁將 `cloudinary.upload()` 或任何長時間的 I/O 操作包裹在 `queryRunner.startTransaction()` 和 `commitTransaction()` 之間。資料庫交易應盡可能短。

*   **規則 #3：必須啟用樂觀鎖**
    *   所有擁有與 Cloudinary 關聯的 `publicId` 欄位的實體 (e.g., `Photo`, `Video`, `Article`)，**必須** 包含 `@VersionColumn()` 裝飾器。
    *   `UPDATE` 操作必須使用 `repository.save(entity)` 而不是 `repository.update()`，以確保版本檢查被觸發。

*   **規則 #4：清理失敗不可中斷主流程**
    *   清理操作（刪除 Cloudinary 上的舊檔案或孤兒檔案）的失敗**絕不能**導致 API 請求失敗。
    *   清理失敗**必須**被記錄（`console.error` 或更正式的日誌系統），並包含足夠的上下文（如 `publicId`），以便手動或自動化工具進行後續補救。

*   **規則 #5：職責分離**
    *   `CloudinaryService` **只**負責與 Cloudinary API 的直接互動（上傳、刪除）。它**不應**包含任何業務邏輯或資料庫操作。
    *   業務服務 (`PhotosService`, etc.) **只**負責編排業務流程（遵循規則 #1）、處理資料庫和呼叫 `CloudinaryService`。

## 4. 最終實作藍圖 (Final Implementation Blueprint)

以下是 `PhotosService` 的程式碼，作為所有類似服務的標準範本。

```typescript
// src/entities/photo.entity.ts
import { ..., VersionColumn } from 'typeorm';

@Entity()
export class Photo {
  // ...
  @Column({ nullable: true })
  publicId: string;

  @Column({ nullable: true })
  url: string;

  @VersionColumn()
  version: number;
}
```

```typescript
// src/photos/photos.service.ts
@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createDto: CreatePhotoDto, file: Express.Multer.File): Promise<Photo> {
    if (!file) throw new BadRequestException('File is required.');

    const uploadResult = await this.cloudinaryService.uploadImage(file, 'photos');

    try {
      const photo = this.photoRepository.create({
        ...createDto,
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
      });
      return await this.photoRepository.save(photo);
    } catch (dbError) {
      await this.cloudinaryService.safelyDeleteResource(uploadResult.public_id);
      throw new InternalServerErrorException('Failed to save photo record.', { cause: dbError });
    }
  }

  async update(id: number, updateDto: UpdatePhotoDto, file?: Express.Multer.File): Promise<Photo> {
    const photo = await this.photoRepository.findOneBy({ id });
    if (!photo) throw new NotFoundException(`Photo with ID ${id} not found.`);

    const oldPublicId = photo.publicId;
    let newUploadResult: UploadApiResponse | null = null;

    if (file) {
      newUploadResult = await this.cloudinaryService.uploadImage(file, 'photos');
      photo.publicId = newUploadResult.public_id;
      photo.url = newUploadResult.secure_url;
    }

    Object.assign(photo, updateDto);

    try {
      const updatedPhoto = await this.photoRepository.save(photo);
      
      if (newUploadResult && oldPublicId) {
        await this.cloudinaryService.safelyDeleteResource(oldPublicId);
      }
      
      return updatedPhoto;
    } catch (dbError) {
      if (newUploadResult) {
        await this.cloudinaryService.safelyDeleteResource(newUploadResult.public_id);
      }
      if (dbError instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException('The record was modified by another user. Please refresh and try again.');
      }
      throw new InternalServerErrorException('Failed to update photo record.', { cause: dbError });
    }
  }

  async remove(id: number): Promise<void> {
    const photo = await this.photoRepository.findOneBy({ id });
    if (!photo) throw new NotFoundException(`Photo with ID ${id} not found.`);

    // 先從資料庫刪除
    await this.photoRepository.remove(photo);

    // 然後再清理外部資源
    if (photo.publicId) {
      await this.cloudinaryService.safelyDeleteResource(photo.publicId);
    }
  }
}
```

```typescript
// src/cloudinary/cloudinary.service.ts
@Injectable()
export class CloudinaryService {
  // ... uploadImage, etc.

  async safelyDeleteResource(publicId: string): Promise<void> {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
      // 根據規則 #4: 記錄錯誤，但不要拋出，以免中斷主流程
      console.error(`[CRITICAL CLEANUP FAILURE] Failed to delete Cloudinary resource ${publicId}. Please investigate.`, error);
      // 在此處整合更高級的日誌或監控系統 (e.g., Sentry, DataDog)
    }
  }
}
```

## 5. 結論 (Conclusion)

此規範提供了一個經得起考驗的、穩健的檔案生命週期管理模型。**嚴格遵守這些規則對於維護我們應用的長期健康和資料完整性至關重要。** 團隊應將此文件作為未來所有相關開發工作的唯一參考標準。
