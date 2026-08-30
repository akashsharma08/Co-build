import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMembersNotificationsOAuth1788200000000 implements MigrationInterface {
  name = 'AddMembersNotificationsOAuth1788200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "password_hash" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "oauth_provider" character varying(32),
      ADD COLUMN "oauth_subject" character varying(255)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_oauth_provider_subject"
      ON "users" ("oauth_provider", "oauth_subject")
      WHERE "oauth_provider" IS NOT NULL AND "oauth_subject" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TYPE "project_member_role_enum" AS ENUM ('owner', 'member')
    `);
    await queryRunner.query(`
      CREATE TABLE "project_members" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" "project_member_role_enum" NOT NULL DEFAULT 'member',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_members_project_user" UNIQUE ("project_id", "user_id"),
        CONSTRAINT "FK_project_members_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_project_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_project_members_user_id" ON "project_members" ("user_id")
    `);
    await queryRunner.query(`
      INSERT INTO "project_members" ("project_id", "user_id", "role")
      SELECT "id", "owner_id", 'owner'::"project_member_role_enum"
      FROM "projects"
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" character varying(64) NOT NULL,
        "title" character varying(160) NOT NULL,
        "body" character varying(500) NOT NULL,
        "link" character varying(255),
        "read_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_id_created_at"
      ON "notifications" ("user_id", "created_at" DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_notifications_user_id_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP INDEX "IDX_project_members_user_id"`);
    await queryRunner.query(`DROP TABLE "project_members"`);
    await queryRunner.query(`DROP TYPE "project_member_role_enum"`);
    await queryRunner.query(`DROP INDEX "UQ_users_oauth_provider_subject"`);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "oauth_subject",
      DROP COLUMN "oauth_provider"
    `);
    await queryRunner.query(`
      UPDATE "users"
      SET "password_hash" = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8wQkqGqGqGqGqGqGqGqGqGqGqGqGqG'
      WHERE "password_hash" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "password_hash" SET NOT NULL
    `);
  }
}
