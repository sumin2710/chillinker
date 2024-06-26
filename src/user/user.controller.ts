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
  Render,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Users } from './entities/user.entity';
import { UserInfo } from '../utils/userinfo.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ErrorInterceptor } from '../common/interceptors/error/error.interceptor';
import { UserGuard } from '../auth/user.guard';
import { UnauthorizedExceptionFilter } from '../unauthorized-exception/unauthorized-exception.filter';
import { AdultVerifyDto } from './dto/adult-verify.dto';

@ApiTags('USER')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '회원가입' })
  @UseInterceptors(FileInterceptor('profileImage'))
  @Post('register')
  @HttpCode(201)
  async register(
    @UploadedFile() file: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
    @Res() res,
  ) {
    const { password, confirmPassword } = createUserDto;
    if (password !== confirmPassword) {
      throw new BadRequestException('비밀번호와 비밀번호확인이 다릅니다.');
    }

    await this.userService.register(file, createUserDto);

    const loginDto = new LoginDto();
    loginDto.email = createUserDto.email;
    loginDto.password = createUserDto.password;

    await this.login(loginDto, res);
    res.render('main.ejs');
  }

  @Render('login')
  @Get('login')
  async showLoginPage() {}

  @Render('register')
  @Get('register')
  async showRegisterPage() {}

  @Render('mypage-update')
  @Get('mypage/update')
  async showUpdatePage() {}

  @ApiOperation({ summary: '로그인' })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res) {
    const tokens = await this.userService.login(loginDto);
    res
      .cookie('accessToken', `Bearer ${tokens.accessToken}`)
      .cookie('refreshToken', `Bearer ${tokens.refreshToken}`)
      .end();
  }

  @ApiOperation({ summary: 'AccessToken 재발급' })
  @Post('refresh')
  async renewAccessToken(@Req() req, @Res() res) {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    const [tokenType, token] = refreshToken.split(' ');
    const newToken = (await this.userService.renewAccessToken(token))
      .accessToken;
    return res.cookie('accessToken', `Bearer ${newToken}`).end();
  }

  @ApiOperation({ summary: '로그아웃' })
  @Get('logout')
  async logout(@Res() res) {
    res.clearCookie('accessToken').clearCookie('refreshToken');
    res.redirect('/main');
  }

  @ApiOperation({ summary: '마이페이지 조회' })
  @UseGuards(UserGuard)
  @Get('mypage')
  @Render('mypage')
  @UseFilters(UnauthorizedExceptionFilter)
  async getMyInfo(@UserInfo() user: Users) {
    const { id, isAdmin } = user;
    const userInfo = await this.userService.getUserInfoById(id);
    return { ...userInfo, isAdmin };
  }

  @ApiOperation({ summary: '회원 정보 수정' })
  @UseInterceptors(FileInterceptor('profileImage'))
  @UseGuards(AuthGuard('jwt'))
  @Patch('mypage/update')
  async updateMyInfo(
    @UploadedFile() file: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto,
    @UserInfo() user: Users,
  ) {
    const { id } = user;
    await this.userService.updateMyInfo(file, id, updateUserDto);
  }

  @ApiOperation({ summary: '회원탈퇴' })
  @UseGuards(AuthGuard('jwt'))
  @Delete('mypage/leave')
  @HttpCode(204)
  async leave(
    @Body() deleteUserDto: DeleteUserDto,
    @UserInfo() user: Users,
    @Res() res,
  ) {
    const { id } = user;

    await this.userService.leave(id, deleteUserDto);
    return res.clearCookie('accessToken').clearCookie('refreshToken').end();
  }

  @ApiOperation({ summary: '성인인증 요청 보내기' })
  @UseInterceptors(FileInterceptor('registrationCardImage'))
  @UseGuards(AuthGuard('jwt'))
  @Post('sendAdultVerify')
  async sendAdultVerifyRequest(
    @UploadedFile() file: Express.Multer.File,
    @Body() adultVerifyDto: AdultVerifyDto,
    @UserInfo() user: Users,
  ) {
    await this.userService.sendAdultVerifyRequest(
      user.id,
      file,
      adultVerifyDto,
    );
  }

  @ApiOperation({ summary: '타 유저 페이지 조회' })
  @Get(':id')
  @Render('userpage')
  async getUserInfo(@Param('id') id: number) {
    return await this.userService.getUserInfoById(id);
  }
}
