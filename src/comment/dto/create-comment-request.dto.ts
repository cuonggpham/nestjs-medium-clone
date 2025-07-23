import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { CreateCommentDto } from './create-comment.dto';

export class CreateCommentRequestDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CreateCommentDto)
  comment: CreateCommentDto;
}
