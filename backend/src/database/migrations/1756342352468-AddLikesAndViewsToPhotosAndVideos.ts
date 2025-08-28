import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLikesAndViewsToPhotosAndVideos1756342352468 implements MigrationInterface {
    name = 'AddLikesAndViewsToPhotosAndVideos1756342352468'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" ADD "likes" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "photos" ADD "views" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "videos" ADD "views" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "videos" ADD "likes" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "likes"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "views"`);
        await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "views"`);
        await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "likes"`);
    }

}
