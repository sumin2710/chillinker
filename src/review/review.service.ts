import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateCReviewsDto } from './dto/review.create.dto';
import { DataSource, Repository } from 'typeorm';
import { ModifyCReviewsDto } from './dto/review.modify.dto';

import { Users } from 'src/user/entities/user.entity';
import {
  CReviewDto,
  PaginationBuilder,
  PaginationRequest,
  PaginationResponse,
} from 'src/utils/pagination';
import { query } from 'express';
import { ReviewLikes } from './entities/review.likes.entity';
import { CReviews } from './entities/chillinker.reivews.entity';
import { PReviews } from './entities/platform.reviews.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(CReviews)
    private readonly chillinkerReviewsRepository: Repository<CReviews>,
    @InjectRepository(PReviews)
    private readonly platformReviewsRepository: Repository<PReviews>,
    @InjectRepository(ReviewLikes)
    private readonly reveiewLikesRepository: Repository<ReviewLikes>,
    private readonly dataSource: DataSource,
  ) {}

  async getCReviews(
    webContentsId: number,
    page?: number,
    order?: string,
    option?: string,
  ) {
    const reviews = await this.chillinkerReviewsRepository.findOne({
      where: { webContentsId },
    });
    if (!reviews) {
      throw new NotFoundException('작품에 작성된 리뷰가 존재하지 않습니다.');
    }
    //option = c, p
    //order은 등록순(recent,만들어진 최신순), 인기순(popular,좋아요순)필요
    if (option == 'c') {
      if (order == 'recent') {
        const recentReviews = await this.chillinkerReviewsRepository.find({
          where: { webContentsId },
          order: { createdAt: 'desc' },
          take: 10,
          skip: (page - 1) * 10,
        });

        return recentReviews;
      } else {
        const defaultReivews = await this.chillinkerReviewsRepository.find({
          where: { webContentsId },
          order: { likeCount: 'desc' },
          take: 10,
          skip: (page - 1) * 10,
        });
        return defaultReivews;
      }
    } else {
      if (order == 'recent') {
        const recentReviews = await this.platformReviewsRepository.find({
          where: { webContentsId },
          order: { createdAt: 'desc' },
          take: 10,
          skip: (page - 1) * 10,
        });

        return recentReviews;
      } else {
        const defaultReivews = await this.platformReviewsRepository.find({
          where: { webContentsId },
          order: { likeCount: 'desc' },
          take: 10,
          skip: (page - 1) * 10,
        });
        return defaultReivews;
      }
    }
  }

  async createReivew(
    user: Users,
    webContentsId: number,
    createReviewDto: CreateCReviewsDto,
  ) {
    const userId = user.id;
    const { content, rate } = createReviewDto;

    const findUserReiew = await this.chillinkerReviewsRepository.findOne({
      where: { userId, webContentsId },
    });

    if (!findUserReiew) {
      throw new ConflictException('작품에 한개의 리뷰만 작성할 수 있습니다.');
    }

    const createReview = await this.chillinkerReviewsRepository.save({
      userId: userId,
      webContentsId: webContentsId,
      content: content,
      rate: rate,
    });

    return createReview;
  }

  async modifyReivew(
    user: Users,
    reviewId: number,
    modifyCReivewDto: ModifyCReviewsDto,
  ) {
    const userId = user.id;
    const { content, rate } = modifyCReivewDto;

    const findReivew = await this.chillinkerReviewsRepository.findOne({
      where: { id: reviewId },
    });

    if (findReivew.userId !== userId) {
      throw new ForbiddenException('작성자만 리뷰를 수정할 수 있습니다.');
    }

    //수정정보 업데이트
    const modifyReivew = await this.chillinkerReviewsRepository.update(
      { id: reviewId },
      modifyCReivewDto,
    );

    return modifyReivew;
  }

  async deleteReivew(user: Users, reviewId: number) {
    const userId = user.id;
    const findReivew = await this.chillinkerReviewsRepository.findOne({
      where: { id: reviewId },
    });

    if (findReivew.userId !== userId) {
      throw new ForbiddenException('작성자만 리뷰를 삭제할 수 있습니다.');
    }

    const deleteReivew = await this.chillinkerReviewsRepository.delete({
      id: reviewId,
    });
  }

  async likeReivew(user: Users, reviewId: number) {
    const userId = user.id;

    const queryRunner = this.dataSource.createQueryRunner();

    const findReview = await this.chillinkerReviewsRepository.findOne({
      where: { id: reviewId },
    });

    if (!findReview) {
      throw new NotFoundException('해당 리뷰를 찾을 수 없습니다.');
    }

    if (findReview.userId == userId) {
      throw new ForbiddenException(
        '본인이 쓴 리뷰에는 좋아요를 누를 수 없습니다.',
      );
    }

    try {
      queryRunner.connect();
      queryRunner.startTransaction();

      const like = await this.reveiewLikesRepository.findOne({
        where: {
          userId: userId,
          cReviewId: reviewId,
        },
      });

      if (!like) {
        await this.reveiewLikesRepository.save({
          like: 1,
          userId: userId,
          cReviewId: reviewId,
        });

        findReview.likeCount += 1;
      } else {
        await this.reveiewLikesRepository.update(
          {
            userId: userId,
            cReviewId: reviewId,
          },
          { like: 0 },
        );

        findReview.likeCount -= 1;
      }
      await this.chillinkerReviewsRepository.save(findReview);

      await queryRunner.commitTransaction();

      return like
        ? '해당 리뷰에 좋아요를 취소했습니다.'
        : '해당 리뷰에 좋아요를 등록했습니다.';
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('리뷰 좋아요에 실패하였습니다.');
    } finally {
      await queryRunner.release();
    }
  }
}
