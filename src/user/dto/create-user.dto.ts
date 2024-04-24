import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  @ApiProperty({ example: 'aaaa1234@gmail.com', description: '이메일' })
  email: string;

  @IsString()
  @IsStrongPassword(
    {},
    {
      message:
        '비밀번호는 영문 알파벳 대,소문자, 숫자, 특수문자(!@#$%^&*)를 포함해야 합니다.',
    },
  )
  @MinLength(8, { message: '비밀번호는 8글자 이상이어야합니다.' })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  @ApiProperty({ example: 'Aaaa@1234', description: '비밀번호' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호 확인을 입력해주세요.' })
  @ApiProperty({ example: 'Aaaa@1234', description: '비밀번호확인' })
  confirmPassword: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty({ message: '닉네임을 입력해주세요.' })
  @ApiProperty({ example: '사과', description: '닉네임' })
  nickname: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '갤럭시 씁니다.', description: '소개' })
  intro: string;

  @IsDateString()
  @ApiProperty({ example: '2000-01-01', description: '생년월일' })
  birthDate: string;
}
