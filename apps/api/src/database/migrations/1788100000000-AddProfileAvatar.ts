import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileAvatar1788100000000 implements MigrationInterface {
  name = 'AddProfileAvatar1788100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "profiles"
      ADD COLUMN "avatar_url" character varying(512)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "profiles"
      DROP COLUMN "avatar_url"
    `);
  }
}
