const { DataSource } = require('typeorm');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 配置資料庫連接
const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.USE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [],
  synchronize: false,
});

async function cleanMediaSync() {
  try {
    await dataSource.initialize();
    console.log('✅ 資料庫連接成功');

    // 獲取資料庫中的媒體檔案
    const dbPhotos = await dataSource.query('SELECT id, "publicId", url, description FROM photos');
    const dbVideos = await dataSource.query('SELECT id, "publicId", url, description FROM videos');
    
    console.log(`📊 清理前統計:`);
    console.log(`   資料庫照片: ${dbPhotos.length} 個`);
    console.log(`   資料庫影片: ${dbVideos.length} 個`);

    // 獲取 Cloudinary 中的資源
    const cloudinaryPhotos = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      max_results: 500,
    });

    const cloudinaryVideos = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'video',
      max_results: 500,
    });

    console.log(`☁️ Cloudinary 統計:`);
    console.log(`   照片: ${cloudinaryPhotos.resources.length} 個`);
    console.log(`   影片: ${cloudinaryVideos.resources.length} 個`);

    // 檢查不一致的檔案
    const dbPhotoIds = dbPhotos.map(p => p.publicId);
    const cloudinaryPhotoIds = cloudinaryPhotos.resources.map(r => r.public_id);
    
    const missingInCloudinary = dbPhotoIds.filter(id => !cloudinaryPhotoIds.includes(id));
    const extraInCloudinary = cloudinaryPhotoIds.filter(id => !dbPhotoIds.includes(id));

    const dbVideoIds = dbVideos.map(v => v.publicId);
    const cloudinaryVideoIds = cloudinaryVideos.resources.map(r => r.public_id);
    
    const missingVideosInCloudinary = dbVideoIds.filter(id => !cloudinaryVideoIds.includes(id));
    const extraVideosInCloudinary = cloudinaryVideoIds.filter(id => !dbVideoIds.includes(id));

    console.log('\n🔍 發現的不一致檔案:');
    console.log(`   照片 - 資料庫有但 Cloudinary 沒有: ${missingInCloudinary.length} 個`);
    console.log(`   照片 - Cloudinary 有但資料庫沒有: ${extraInCloudinary.length} 個`);
    console.log(`   影片 - 資料庫有但 Cloudinary 沒有: ${missingVideosInCloudinary.length} 個`);
    console.log(`   影片 - Cloudinary 有但資料庫沒有: ${extraVideosInCloudinary.length} 個`);

    // 清理資料庫中的無效記錄
    if (missingInCloudinary.length > 0) {
      console.log('\n🧹 清理資料庫中無效的照片記錄...');
      for (const publicId of missingInCloudinary) {
        await dataSource.query(
          'DELETE FROM photos WHERE "publicId" = $1',
          [publicId]
        );
        console.log(`✅ 已刪除照片記錄: ${publicId}`);
      }
    }

    if (missingVideosInCloudinary.length > 0) {
      console.log('\n🧹 清理資料庫中無效的影片記錄...');
      for (const publicId of missingVideosInCloudinary) {
        await dataSource.query(
          'DELETE FROM videos WHERE "publicId" = $1',
          [publicId]
        );
        console.log(`✅ 已刪除影片記錄: ${publicId}`);
      }
    }

    // 清理 Cloudinary 中的孤立檔案
    const allExtraFiles = [...extraInCloudinary, ...extraVideosInCloudinary];
    if (allExtraFiles.length > 0) {
      console.log('\n🗑️ 清理 Cloudinary 中的孤立檔案...');
      
      for (const publicId of allExtraFiles) {
        try {
          const resourceType = extraInCloudinary.includes(publicId) ? 'image' : 'video';
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
          console.log(`✅ 已刪除 Cloudinary 檔案: ${publicId}`);
        } catch (error) {
          console.log(`⚠️ 刪除 Cloudinary 檔案失敗: ${publicId} - ${error.message}`);
        }
      }
    }

    // 重新獲取統計數據
    const updatedDbPhotos = await dataSource.query('SELECT COUNT(*) as count FROM photos');
    const updatedDbVideos = await dataSource.query('SELECT COUNT(*) as count FROM videos');
    
    console.log('\n📊 清理後統計:');
    console.log(`   資料庫照片: ${updatedDbPhotos[0].count} 個`);
    console.log(`   資料庫影片: ${updatedDbVideos[0].count} 個`);

    // 重新檢查 Cloudinary
    const updatedCloudinaryPhotos = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      max_results: 500,
    });

    const updatedCloudinaryVideos = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'video',
      max_results: 500,
    });

    console.log(`☁️ Cloudinary 統計:`);
    console.log(`   照片: ${updatedCloudinaryPhotos.resources.length} 個`);
    console.log(`   影片: ${updatedCloudinaryVideos.resources.length} 個`);

    await dataSource.destroy();
    console.log('\n✅ 清理完成');

  } catch (error) {
    console.error('❌ 清理失敗:', error.message);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

cleanMediaSync();
