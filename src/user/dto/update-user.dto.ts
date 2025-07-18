import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  @Match('password', {
    message: 'Password confirmation does not match password',
  })
  confirmPassword?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  image?: string;
}
