import { MigrationInterface, QueryRunner } from "typeorm";

export class AddViewsToArticles1756341420777 implements MigrationInterface {
    name = 'AddViewsToArticles1756341420777'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34"`);
        await queryRunner.query(`DROP INDEX "public"."idx_seo_settings_updated_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_photos_public_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_photos_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_photos_updated_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_photos_category_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_geo_city"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_is_draft"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_updated_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_category_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_category_is_draft"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_is_draft_updated_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_category_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_geo_lat_lng"`);
        await queryRunner.query(`DROP INDEX "public"."idx_categories_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_categories_type_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_categories_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_videos_public_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_videos_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_videos_updated_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_videos_category_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_users_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_users_is_disabled"`);
        await queryRunner.query(`DROP INDEX "public"."idx_users_is_admin"`);
        await queryRunner.query(`DROP INDEX "public"."idx_visitor_log_ip"`);
        await queryRunner.query(`DROP INDEX "public"."idx_visitor_log_page"`);
        await queryRunner.query(`DROP INDEX "public"."idx_visitor_log_session_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_visitor_log_ip_timestamp"`);
        await queryRunner.query(`DROP INDEX "public"."idx_visitor_log_country"`);
        await queryRunner.query(`DROP INDEX "public"."idx_visitor_log_page_timestamp"`);
        await queryRunner.query(`DROP INDEX "public"."idx_visitor_log_country_timestamp"`);
        await queryRunner.query(`DROP INDEX "public"."idx_photos_tags_tag_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_photos_tags_composite"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_tags_tag_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_tags_composite"`);
        await queryRunner.query(`DROP INDEX "public"."idx_videos_tags_tag_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_videos_tags_composite"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "authorId"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "excerpt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isDisabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isAdmin"`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "views" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "views"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isAdmin" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isDisabled" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "excerpt" character varying`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "authorId" integer`);
        await queryRunner.query(`CREATE INDEX "idx_videos_tags_composite" ON "videos_tags_tags" ("tagsId", "videosId") `);
        await queryRunner.query(`CREATE INDEX "idx_videos_tags_tag_id" ON "videos_tags_tags" ("tagsId") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_tags_composite" ON "articles_tags_tags" ("articlesId", "tagsId") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_tags_tag_id" ON "articles_tags_tags" ("tagsId") `);
        await queryRunner.query(`CREATE INDEX "idx_photos_tags_composite" ON "photos_tags_tags" ("photosId", "tagsId") `);
        await queryRunner.query(`CREATE INDEX "idx_photos_tags_tag_id" ON "photos_tags_tags" ("tagsId") `);
        await queryRunner.query(`CREATE INDEX "idx_visitor_log_country_timestamp" ON "visitor_log" ("country", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "idx_visitor_log_page_timestamp" ON "visitor_log" ("page", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "idx_visitor_log_country" ON "visitor_log" ("country") WHERE (country IS NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "idx_visitor_log_ip_timestamp" ON "visitor_log" ("ip", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "idx_visitor_log_session_id" ON "visitor_log" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "idx_visitor_log_page" ON "visitor_log" ("page") `);
        await queryRunner.query(`CREATE INDEX "idx_visitor_log_ip" ON "visitor_log" ("ip") `);
        await queryRunner.query(`CREATE INDEX "idx_users_is_admin" ON "users" ("isAdmin") `);
        await queryRunner.query(`CREATE INDEX "idx_users_is_disabled" ON "users" ("isDisabled") `);
        await queryRunner.query(`CREATE INDEX "idx_users_created_at" ON "users" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_videos_category_id" ON "videos" ("categoryId") `);
        await queryRunner.query(`CREATE INDEX "idx_videos_updated_at" ON "videos" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "idx_videos_created_at" ON "videos" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_videos_public_id" ON "videos" ("publicId") `);
        await queryRunner.query(`CREATE INDEX "idx_categories_name" ON "categories" ("name") `);
        await queryRunner.query(`CREATE INDEX "idx_categories_type_name" ON "categories" ("name", "type") `);
        await queryRunner.query(`CREATE INDEX "idx_categories_type" ON "categories" ("type") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_geo_lat_lng" ON "articles" ("geoLatitude", "geoLongitude") WHERE ("geoLatitude" IS NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "idx_articles_category_created_at" ON "articles" ("categoryId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_is_draft_updated_at" ON "articles" ("isDraft", "updatedAt") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_category_is_draft" ON "articles" ("categoryId", "isDraft") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_category_id" ON "articles" ("categoryId") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_updated_at" ON "articles" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_created_at" ON "articles" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_is_draft" ON "articles" ("isDraft") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_geo_city" ON "articles" ("geoCity") `);
        await queryRunner.query(`CREATE INDEX "idx_photos_category_id" ON "photos" ("categoryId") `);
        await queryRunner.query(`CREATE INDEX "idx_photos_updated_at" ON "photos" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "idx_photos_created_at" ON "photos" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_photos_public_id" ON "photos" ("publicId") `);
        await queryRunner.query(`CREATE INDEX "idx_seo_settings_updated_at" ON "seo_settings" ("updatedAt") `);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
