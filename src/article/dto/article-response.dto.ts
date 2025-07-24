import {
  IsString,
  IsNumber,
  IsDate,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ArticleAuthorDto {
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

export class ArticleDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsArray()
  @IsString({ each: true })
  tagList: string[];

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @IsBoolean()
  favorited: boolean;

  @IsNumber()
  favoritesCount: number;

  @Type(() => ArticleAuthorDto)
  author: ArticleAuthorDto;
}

export class ArticleResponseDto {
  @Type(() => ArticleDto)
  article: ArticleDto;
}

export class ArticlesResponseDto {
  @Type(() => ArticleDto)
  articles: ArticleDto[];

  @IsNumber()
  articlesCount: number;
}

export class DeleteArticleResponseDto {
  @IsString()
  message: string;

  @IsString()
  deletedSlug: string;
}
