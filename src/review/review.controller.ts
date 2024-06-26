import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Render,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateCReviewsDto } from './dto/review.create.dto';
import { ModifyCReviewsDto } from './dto/review.modify.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from '../utils/userinfo.decorator';
import { Users } from '../user/entities/user.entity';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewSummaryDto } from './dto/review.summary.dto';
import { OptionalAuthGuard } from '../auth/optinal.authguard';
import { ErrorInterceptor } from '../common/interceptors/error/error.interceptor';

@ApiTags('REVIEW')
@Controller()
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @ApiOperation({ summary: '리뷰 조회' })
  @UseGuards(OptionalAuthGuard)
  @Render('detailContent')
  @Get('books/:webContentsId')
  async getCReivew(
    @Req() req,
    @Param('webContentsId', ParseIntPipe) webContentsId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('order') order?: string,
    @Query('option') option?: string,
  ) {
    const user = req.user;
    console.log('유저: ', user);
    const result = await this.reviewService.getCReviews(
      webContentsId,
      req.user,
      page,
      order,
      option,
    );

    const { content, reviewList, totalPages, myReview } = result;

    return {
      content,
      reviewList,
      totalPages,
      page,
      order,
      option,
      user,
      myReview,
    };
  }

  @ApiOperation({ summary: '리뷰 좋아요/좋아요 취소' })
  @UseGuards(AuthGuard('jwt'))
  @Post('/reviews/:reviewId/likes')
  async likeReview(
    @UserInfo() user: Users,
    @Param('reviewId', ParseIntPipe) reviewId: number,
  ) {
    console.log('df');
    return await this.reviewService.likeReview(user, reviewId);
  }

  @ApiOperation({ summary: '리뷰 작성한 작품 조회' })
  @UseGuards(AuthGuard('jwt'))
  @Render('reviewed_list')
  @Get('reviewedTitles')
  async getTitlesWithReviews(@UserInfo() user: Users) {
    const reviews = await this.reviewService.getTitlesWithReviews(user.id);

    const reviewSummaries: ReviewSummaryDto[] = reviews.map((review) => {
      return new ReviewSummaryDto(
        review.image,
        review.title,
        review.rate,
        review.id,
      );
    });

    return { reviewedWorks: reviewSummaries };
  }

  @ApiOperation({ summary: '리뷰 작성' })
  @UseGuards(AuthGuard('jwt'))
  @Post('books/:webContentsId')
  async createReview(
    @Param('webContentsId', ParseIntPipe) webContentsId: number,
    @UserInfo() user: Users,
    @Body() createCReviewsDto: CreateCReviewsDto,
  ) {
    console.log(user);
    return await this.reviewService.createReivew(
      user,
      webContentsId,
      createCReviewsDto,
    );
  }

  @ApiOperation({ summary: '리뷰 수정' })
  @UseGuards(AuthGuard('jwt'))
  @Patch('books/:webContentsId/:reviewId')
  async modifyReview(
    @UserInfo() user: Users,
    @Param('webContentsId', ParseIntPipe) webContentsId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() modifyCReviewsDto: ModifyCReviewsDto,
  ) {
    return await this.reviewService.modifyReivew(
      user,
      webContentsId,
      reviewId,
      modifyCReviewsDto,
    );
  }

  @ApiOperation({ summary: '리뷰 삭제' })
  @UseGuards(AuthGuard('jwt'))
  @Delete('books/:webContentsId/:reviewId')
  @HttpCode(204)
  async deleteReview(
    @UserInfo() user: Users,
    @Param('webContentsId', ParseIntPipe) webContentsId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
  ) {
    await this.reviewService.deleteReview(user, webContentsId, reviewId);
  }

  @UseGuards(OptionalAuthGuard)
  @Render('reviewTop')
  @Get('rank/reviews')
  async getTopReviews(
    @Req() req,
    @Query('page') page?: string,
    @Query('order') order?: string,
  ) {
    const topReviews = await this.reviewService.getTopReviews(
      req.user,
      +page,
      order,
    );

    const { reviews, totalPages } = topReviews;

    return {
      reviews,
      totalPages,
      page,
      order,
      userInfo: this.reviewService.isAdult(req.user),
    };
  }
}
