import {
  IsString,
  IsNumber,
  IsDate,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CommentAuthorDto {
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

export class CommentDto {
  @IsNumber()
  id: number;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @IsString()
  body: string;

  @Type(() => CommentAuthorDto)
  author: CommentAuthorDto;
}

export class CommentResponseDto {
  @Type(() => CommentDto)
  comment: CommentDto;
}

export class CommentsResponseDto {
  @Type(() => CommentDto)
  comments: CommentDto[];
}

export class DeleteCommentResponseDto {
  @IsString()
  message: string;

  @IsNumber()
  deletedCommentId: number;
}
