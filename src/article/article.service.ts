import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article, ArticleResponse } from './interfaces/article.interface';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async create(
    createArticleDto: CreateArticleDto,
    authorId: number,
  ): Promise<{ article: ArticleResponse }> {
    const { title, description, body, tagList } = createArticleDto;

    const baseSlug = this.generateSlug(title);
    const slug = await this.ensureUniqueSlug(baseSlug);

    const article = await this.prisma.article.create({
      data: {
        title,
        description,
        body,
        slug,
        tagList: tagList || [],
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            bio: true,
            image: true,
          },
        },
      },
    });

    return {
      article: this.formatArticleResponse(article),
    };
  }

  async findBySlug(slug: string): Promise<{ article: ArticleResponse }> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            bio: true,
            image: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return {
      article: this.formatArticleResponse(article),
    };
  }

  async updateArticle(
    slug: string,
    updateArticleDto: UpdateArticleDto,
    userId: number,
  ): Promise<{ article: ArticleResponse }> {
    const { title, description, body, tagList } = updateArticleDto;

    const existingArticle = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            bio: true,
            image: true,
          },
        },
      },
    });

    if (!existingArticle) {
      throw new NotFoundException('Article not found');
    }

    if (existingArticle.authorId !== userId) {
      throw new ForbiddenException('You can only update your own articles');
    }

    if (title && title !== existingArticle.title) {
      const baseSlug = this.generateSlug(title);
      const newSlug = await this.ensureUniqueSlug(baseSlug, existingArticle.id);

      const conflictingArticle = await this.prisma.article.findFirst({
        where: {
          AND: [{ id: { not: existingArticle.id } }, { slug: newSlug }],
        },
      });

      if (conflictingArticle) {
        throw new ConflictException(
          'Article with similar title already exists',
        );
      }
    }

    const updateData: {
      title?: string;
      description?: string;
      body?: string;
      slug?: string;
      tagList?: string[];
    } = {};

    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = await this.ensureUniqueSlug(
        this.generateSlug(title),
        existingArticle.id,
      );
    }
    if (description !== undefined) updateData.description = description;
    if (body !== undefined) updateData.body = body;
    if (tagList !== undefined) updateData.tagList = tagList;

    const updatedArticle = await this.prisma.article.update({
      where: { slug },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            bio: true,
            image: true,
          },
        },
      },
    });

    return {
      article: this.formatArticleResponse(updatedArticle),
    };
  }

  async deleteArticle(slug: string, userId: number): Promise<void> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own articles');
    }

    await this.prisma.article.delete({
      where: { slug },
    });
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  }

  private async ensureUniqueSlug(
    baseSlug: string,
    excludeId?: number,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const conditions: Array<{ slug?: string; id?: { not: number } }> = [
        { slug },
      ];

      if (excludeId) {
        conditions.push({ id: { not: excludeId } });
      }

      const existingArticle = await this.prisma.article.findFirst({
        where: {
          AND: conditions,
        },
      });

      if (!existingArticle) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  private formatArticleResponse(article: Article): ArticleResponse {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: Array.isArray(article.tagList)
        ? (article.tagList as string[])
        : [],
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: {
        username: article.author?.username || '',
        bio: article.author?.bio || '',
        image: article.author?.image || null,
      },
    };
  }
}
