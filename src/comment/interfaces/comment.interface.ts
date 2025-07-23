export interface Comment {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  articleId: number;
  author?: {
    id: number;
    email: string;
    username: string;
    bio: string | null;
    image: string | null;
  };
}

export interface CommentResponse {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: {
    username: string;
    bio: string;
    image: string | null;
    following: boolean; // implement following function later
  };
}
