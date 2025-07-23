import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { UpdateArticleDto } from './update-article.dto';

export class UpdateArticleRequestDto {
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateArticleDto)
  article: UpdateArticleDto;
}
