import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ProfileDto {
  @IsString()
  username: string;

  @IsString()
  bio: string;

  @IsOptional()
  @IsString()
  image: string | null;

  @IsBoolean()
  following: boolean;
}

export class ProfileResponseDto {
  @Type(() => ProfileDto)
  profile: ProfileDto;
}
