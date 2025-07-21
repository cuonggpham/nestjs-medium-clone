import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleRequestDto } from './dto/create-article-request.dto';
import { UpdateArticleRequestDto } from './dto/update-article-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get(':slug')
  async getArticle(@Param('slug') slug: string) {
    return this.articleService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createArticle(
    @Body() createArticleRequest: CreateArticleRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articleService.create(createArticleRequest.article, user.id);
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard)
  async updateArticle(
    @Param('slug') slug: string,
    @Body() updateArticleRequest: UpdateArticleRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articleService.updateArticle(
      slug,
      updateArticleRequest.article,
      user.id,
    );
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteArticle(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.articleService.deleteArticle(slug, user.id);
  }
}
