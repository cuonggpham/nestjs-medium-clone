import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { CreateArticleDto } from './create-article.dto';

export class CreateArticleRequestDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CreateArticleDto)
  article: CreateArticleDto;
}
