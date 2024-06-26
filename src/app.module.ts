import Joi from 'joi';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ReviewController } from './review/review.controller';
import { ReviewModule } from './review/review.module';
import { CollectionModule } from './collection/collection.module';
import { FollowModule } from './follow/follow.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WebContentModule } from './web-content/web-content.module';
import { RedisModule } from './redis/redis.module';
import { CrawlerModule } from './crawler/crawler.module';
import { StorageModule } from './storage/storage.module';
import { LikeModule } from './like/like.module';
import { AdminModule } from './admin/admin.module';

const typeOrmModuleOptions = {
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => ({
    namingStrategy: new SnakeNamingStrategy(),
    type: 'mysql',
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    database: configService.get('DB_NAME'),
    autoLoadEntities: true,
    synchronize: configService.get('DB_SYNC'),
    logging: true,
    charset: 'utf8mb4',
  }),
  inject: [ConfigService],
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    AuthModule,
    UserModule,
    FollowModule,
    ReviewModule,
    CollectionModule,
    WebContentModule,
    RedisModule,
    ScheduleModule.forRoot(),
    CrawlerModule,
    LikeModule,
    StorageModule,
    AdminModule,
  ],
  controllers: [ReviewController],
  providers: [],
})
export class AppModule {}
