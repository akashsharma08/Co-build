import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthProfilesProjectsApps1787900000000 implements MigrationInterface {
  name = 'AddAuthProfilesProjectsApps1787900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" character varying(255)`,
    );
    await queryRunner.query(`
      UPDATE "users"
      SET "password_hash" = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8wQkqGqGqGqGqGqGqGqGqGqGqGqGqG'
      WHERE "password_hash" IS NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`,
    );

    await queryRunner.query(
      `CREATE TYPE "remote_preference_enum" AS ENUM ('remote', 'hybrid', 'onsite', 'flexible')`,
    );
    await queryRunner.query(
      `CREATE TYPE "experience_level_enum" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert')`,
    );
    await queryRunner.query(
      `CREATE TYPE "availability_range_enum" AS ENUM ('2-5', '5-10', '10-20', '20+', 'full-time')`,
    );
    await queryRunner.query(
      `CREATE TYPE "profile_visibility_enum" AS ENUM ('public', 'platform', 'hidden')`,
    );
    await queryRunner.query(`
      CREATE TABLE "profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "headline" character varying(160),
        "bio" text,
        "location" character varying(120),
        "remote_preference" "remote_preference_enum" NOT NULL DEFAULT 'flexible',
        "experience_level" "experience_level_enum" NOT NULL DEFAULT 'beginner',
        "languages" jsonb NOT NULL DEFAULT '[]',
        "availability" "availability_range_enum" NOT NULL DEFAULT '5-10',
        "visibility" "profile_visibility_enum" NOT NULL DEFAULT 'public',
        "skills" jsonb NOT NULL DEFAULT '[]',
        "interests" jsonb NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "project_goal_enum" AS ENUM ('learning', 'portfolio', 'startup', 'open_source', 'competition')`,
    );
    await queryRunner.query(
      `CREATE TYPE "project_stage_enum" AS ENUM ('idea', 'planning', 'development', 'testing', 'launching')`,
    );
    await queryRunner.query(
      `CREATE TYPE "project_status_enum" AS ENUM ('open', 'paused', 'closed', 'archived')`,
    );
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "name" character varying(120) NOT NULL,
        "short_description" character varying(280) NOT NULL,
        "detailed_description" text NOT NULL,
        "category" character varying(80) NOT NULL,
        "stage" "project_stage_enum" NOT NULL DEFAULT 'idea',
        "goal" "project_goal_enum" NOT NULL DEFAULT 'learning',
        "required_roles" jsonb NOT NULL DEFAULT '[]',
        "skills" jsonb NOT NULL DEFAULT '[]',
        "time_commitment" character varying(40) NOT NULL,
        "status" "project_status_enum" NOT NULL DEFAULT 'open',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_projects_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "application_status_enum" AS ENUM ('pending', 'shortlisted', 'accepted', 'rejected')`,
    );
    await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "applicant_id" uuid NOT NULL,
        "introduction" text NOT NULL,
        "skills" jsonb NOT NULL DEFAULT '[]',
        "availability" character varying(40) NOT NULL,
        "portfolio_links" jsonb NOT NULL DEFAULT '[]',
        "status" "application_status_enum" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_applications_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_applications_project_applicant" UNIQUE ("project_id", "applicant_id"),
        CONSTRAINT "FK_applications_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_applications_applicant" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(`DROP TYPE "application_status_enum"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TYPE "project_status_enum"`);
    await queryRunner.query(`DROP TYPE "project_stage_enum"`);
    await queryRunner.query(`DROP TYPE "project_goal_enum"`);
    await queryRunner.query(`DROP TABLE "profiles"`);
    await queryRunner.query(`DROP TYPE "profile_visibility_enum"`);
    await queryRunner.query(`DROP TYPE "availability_range_enum"`);
    await queryRunner.query(`DROP TYPE "experience_level_enum"`);
    await queryRunner.query(`DROP TYPE "remote_preference_enum"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
  }
}
