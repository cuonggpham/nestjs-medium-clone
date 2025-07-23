import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './interfaces/comment.interface';
import {
  CommentResponseDto,
  CommentsResponseDto,
  DeleteCommentResponseDto,
  CommentDto,
} from './dto/comment-response.dto';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async createComment(
    articleSlug: string,
    createCommentDto: CreateCommentDto,
    authorId: number,
  ): Promise<CommentResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        body: createCommentDto.body,
        authorId,
        articleId: article.id,
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
      comment: this.formatCommentResponse(comment),
    };
  }

  async getCommentsByArticleSlug(
    articleSlug: string,
  ): Promise<CommentsResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const comments = await this.prisma.comment.findMany({
      where: { articleId: article.id },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      comments: comments.map((comment) => this.formatCommentResponse(comment)),
    };
  }

  async deleteComment(
    articleSlug: string,
    commentId: number,
    userId: number,
  ): Promise<DeleteCommentResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        articleId: article.id,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return {
      message: 'Comment deleted successfully',
      deletedCommentId: commentId,
    };
  }

  private formatCommentResponse(comment: Comment): CommentDto {
    return {
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      author: {
        username: comment.author?.username || '',
        bio: comment.author?.bio || '',
        image: comment.author?.image || null,
        following: false, // implement following function later
      },
    };
  }
}
