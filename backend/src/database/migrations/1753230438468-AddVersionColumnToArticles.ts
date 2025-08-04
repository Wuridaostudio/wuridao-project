import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVersionColumnToArticles1753230438468 implements MigrationInterface {
    name = 'AddVersionColumnToArticles1753230438468'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, add the column as nullable
        await queryRunner.query(`ALTER TABLE "articles" ADD "version" integer`);
        
        // Update existing records to have version = 1
        await queryRunner.query(`UPDATE "articles" SET "version" = 1 WHERE "version" IS NULL`);
        
        // Then make it NOT NULL
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "version" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "version"`);
    }
}
