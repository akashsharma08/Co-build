import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        API_PORT: Joi.number().port().default(4000),
        API_PUBLIC_URL: Joi.string().uri().default('http://localhost:4000'),
        WEB_URL: Joi.string().uri().default('http://localhost:3000'),
        DATABASE_URL: Joi.string()
          .uri()
          .default('postgresql://cobuild:cobuild@localhost:5433/cobuild'),
        DATABASE_SSL: Joi.boolean().default(false),
        JWT_SECRET: Joi.string().min(16).default('cobuild-dev-jwt-secret'),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        REFRESH_TOKEN_DAYS: Joi.number().integer().min(1).default(30),
        GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
        GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
        GITHUB_CLIENT_ID: Joi.string().allow('').optional(),
        GITHUB_CLIENT_SECRET: Joi.string().allow('').optional(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
        ssl: config.get<boolean>('DATABASE_SSL')
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
    UsersModule,
    AuthModule,
    ProfilesModule,
    ProjectsModule,
    ApplicationsModule,
    MembersModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
