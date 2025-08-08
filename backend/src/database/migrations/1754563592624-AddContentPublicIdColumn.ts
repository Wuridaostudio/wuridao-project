import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentPublicIdColumn1754563592624
  implements MigrationInterface
{
  name = 'AddContentPublicIdColumn1754563592624';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" ADD "contentPublicId" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" DROP COLUMN "contentPublicId"`,
    );
  }
}
