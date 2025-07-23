import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleRequestDto } from './dto/create-article-request.dto';
import { UpdateArticleRequestDto } from './dto/update-article-request.dto';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  async listArticles(@Query() query: ListArticlesQueryDto) {
    return this.articleService.listArticles(query);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  async getFeedArticles(
    @Query() query: { limit?: number; offset?: number },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articleService.getFeedArticles(query, user.id);
  }

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
    return this.articleService.createArticle(
      createArticleRequest.article,
      user.id,
    );
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
  async deleteArticle(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articleService.deleteArticle(slug, user.id);
  }
}
