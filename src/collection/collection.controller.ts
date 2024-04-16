import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateColDto } from './dto/createCol.dto';
import { UpdateColDto } from './dto/updateCol.dto';
import { UserInfo } from '../utils/userinfo.decorator';
import { Users } from '../user/entities/user.entity';

// import { Collections } from './entities/collections.entity';

@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  //   내 컬렉션 목록 조회
  @UseGuards(AuthGuard('jwt'))
  @Get('/')
  async myCollections(@UserInfo() user: Users) {
    const myColList = await this.collectionService.getMyColList(user.id);
    return await myColList;
  }

  // 타 유저 컬렉션 목록 조회
  @UseGuards(AuthGuard('jwt'))
  @Get('/:userId')
  async userCollections(@Param('userId') userId: number) {
    const userColList = await this.collectionService.getUserColList(userId);
    return await userColList;
  }

  // 내 컬렉션 상세 조회
  @UseGuards(AuthGuard('jwt'))
  @Get('/:collectionId')
  async myCollection(@Param('collectionId') collectionId: number) {
    const myCol = await this.collectionService.getMyCol(collectionId);
    return myCol;
  }

  // 컬렉션 생성
  @UseGuards(AuthGuard('jwt'))
  @Post('/')
  async addCollection(
    @Body() createColDto: CreateColDto,
    @UserInfo() user: Users,
  ) {
    return await this.collectionService.createCol(createColDto, user.id);
  }

  // 컬렉션 수정
  @UseGuards(AuthGuard('jwt'))
  @Patch('/:collectionId')
  async updateCollection(
    @UserInfo() user: Users,
    @Param('collectionId') collectionId: number,
    @Body() updateColDto: UpdateColDto,
  ) {
    return await this.collectionService.updateCol(collectionId, updateColDto);
  }

  // 컬렉션 삭제
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(204)
  @Delete('/:collectionId')
  async deleteCollection(
    @UserInfo() user: Users,
    @Param('collectionId') collectionId: number,
  ) {
    const userId = user.id;
    return await this.collectionService.deleteCol(userId, collectionId);
  }

  // 컨텐츠 추가
  @UseGuards(AuthGuard('jwt'))
  @Post('/:collectionId/content')
  async addContentToCollection(
    @UserInfo() user: Users,
    @Param('collectionId') collectionId: number,
    @Body('webContentId') webContentId: number,
  ) {
    const userId = user.id;

    const isContentExist =
      await this.collectionService.isContentExistInCollection(
        userId,
        collectionId,
        webContentId,
      );
    if (isContentExist) {
      throw new BadRequestException('이미 존재하는 컨텐츠입니다.');
    }

    return await this.collectionService.addContentToCollection(
      userId,
      collectionId,
      webContentId,
    );
  }

  // 컨텐츠 삭제
  @UseGuards(AuthGuard('jwt'))
  @Delete('/:collectionId/content')
  async removeContentFromCollection(
    @UserInfo() user: Users,
    @Param('collectionId') collectionId: number,
    @Body('webContentId') webContentId: number,
  ) {
    const userId = user.id;
    return await this.collectionService.removeContentFromCollection(
      userId,
      collectionId,
      webContentId,
    );
  }
}
