import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import {
  ArticleResponseDto,
  ArticlesResponseDto,
  DeleteArticleResponseDto,
} from './dto/article-response.dto';
import { Article, ArticleResponse } from './interfaces/article.interface';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async createArticle(
    createArticleDto: CreateArticleDto,
    authorId: number,
  ): Promise<ArticleResponseDto> {
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
      article: await this.formatArticleResponse(article, true, authorId),
    };
  }

  async findBySlug(
    slug: string,
    currentUserId?: number,
  ): Promise<ArticleResponseDto> {
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
      article: await this.formatArticleResponse(article, true, currentUserId),
    };
  }

  async updateArticle(
    slug: string,
    updateArticleDto: UpdateArticleDto,
    userId: number,
  ): Promise<ArticleResponseDto> {
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
      article: await this.formatArticleResponse(updatedArticle, true, userId),
    };
  }

  async deleteArticle(
    slug: string,
    userId: number,
  ): Promise<DeleteArticleResponseDto> {
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

    return {
      message: 'Article deleted successfully',
      deletedSlug: slug,
    };
  }

  async listArticles(
    query: ListArticlesQueryDto,
    currentUserId?: number,
  ): Promise<ArticlesResponseDto> {
    const { tag, author, favorited, limit = 20, offset = 0 } = query;

    const where: { authorId?: number } = {};

    if (author) {
      const authorUser = await this.prisma.user.findUnique({
        where: { username: author },
      });
      if (!authorUser) {
        return { articles: [], articlesCount: 0 };
      }
      where.authorId = authorUser.id;
    }

    // implement later
    if (favorited) {
      return { articles: [], articlesCount: 0 };
    }

    let articles = await this.prisma.article.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    if (tag) {
      articles = articles.filter((article) => {
        const tagList = article.tagList as string[] | null;
        return tagList?.includes(tag);
      });
    }

    const totalCount = articles.length;
    const paginatedArticles = articles.slice(offset, offset + limit);

    const followMap = new Map<number, boolean>();
    if (currentUserId && paginatedArticles.length > 0) {
      const authorIds = paginatedArticles
        .map((article) => article.author?.id)
        .filter((id): id is number => id !== undefined && id !== currentUserId);

      if (authorIds.length > 0) {
        const follows = await this.prisma.follow.findMany({
          where: {
            followerId: currentUserId,
            followingId: { in: authorIds },
          },
          select: { followingId: true },
        });

        follows.forEach((follow) => {
          followMap.set(follow.followingId, true);
        });
      }
    }

    return {
      articles: paginatedArticles.map((article) =>
        this.formatArticleResponseWithFollowMap(
          article,
          false,
          currentUserId,
          followMap,
        ),
      ),
      articlesCount: totalCount,
    };
  }

  async getFeedArticles(
    query: { limit?: number; offset?: number },
    userId: number,
  ): Promise<ArticlesResponseDto> {
    const { limit = 20, offset = 0 } = query;

    const followingUsers = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = followingUsers.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return { articles: [], articlesCount: 0 };
    }

    const [articles, totalCount] = await Promise.all([
      this.prisma.article.findMany({
        where: { authorId: { in: followingIds } },
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
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.article.count({ where: { authorId: { in: followingIds } } }),
    ]);

    // Since these are feed articles, all authors are being followed
    const followMap = new Map<number, boolean>();
    followingIds.forEach((id) => followMap.set(id, true));

    return {
      articles: articles.map((article) =>
        this.formatArticleResponseWithFollowMap(
          article,
          false,
          userId,
          followMap,
        ),
      ),
      articlesCount: totalCount,
    };
  }

  private async formatArticleResponse(
    article: Article,
    includeBody = true,
    currentUserId?: number,
  ): Promise<ArticleResponse> {
    let isFollowing = false;

    if (
      currentUserId &&
      article.author &&
      currentUserId !== article.author.id
    ) {
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: article.author.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      ...(includeBody && { body: article.body }),
      tagList: Array.isArray(article.tagList)
        ? (article.tagList as string[])
        : [],
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: false, // implement later
      favoritesCount: 0, // implement later
      author: {
        username: article.author?.username || '',
        bio: article.author?.bio || '',
        image: article.author?.image || null,
        following: isFollowing,
      },
    };
  }

  private formatArticleResponseWithFollowMap(
    article: Article,
    includeBody = true,
    currentUserId?: number,
    followMap?: Map<number, boolean>,
  ): ArticleResponse {
    let isFollowing = false;

    if (
      currentUserId &&
      article.author &&
      currentUserId !== article.author.id &&
      followMap
    ) {
      isFollowing = followMap.get(article.author.id) || false;
    }

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      ...(includeBody && { body: article.body }),
      tagList: Array.isArray(article.tagList)
        ? (article.tagList as string[])
        : [],
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: false, // implement later
      favoritesCount: 0, // implement later
      author: {
        username: article.author?.username || '',
        bio: article.author?.bio || '',
        image: article.author?.image || null,
        following: isFollowing,
      },
    };
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
      const where = excludeId ? { slug, id: { not: excludeId } } : { slug };

      const existingArticle = await this.prisma.article.findFirst({ where });

      if (!existingArticle) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}
