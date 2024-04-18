import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Likes } from './entities/likes.entity';
import { WebContents } from '../web-content/entities/webContents.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Likes, WebContents])],
  providers: [LikeService],
  controllers: [LikeController]
})
export class LikeModule {}
