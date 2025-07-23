import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentRequestDto } from './dto/create-comment-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Controller('articles/:slug/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async getComments(@Param('slug') slug: string) {
    return this.commentService.getCommentsByArticleSlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('slug') slug: string,
    @Body() createCommentRequest: CreateCommentRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commentService.createComment(
      slug,
      createCommentRequest.comment,
      user.id,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) commentId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commentService.deleteComment(slug, commentId, user.id);
  }
}
