export class CommentAuthorDto {
  username: string;
  bio: string;
  image: string | null;
  following: boolean;
}

export class CommentDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: CommentAuthorDto;
}

export class CommentResponseDto {
  comment: CommentDto;
}

export class CommentsResponseDto {
  comments: CommentDto[];
}

export class DeleteCommentResponseDto {
  message: string;
  deletedCommentId: number;
}
