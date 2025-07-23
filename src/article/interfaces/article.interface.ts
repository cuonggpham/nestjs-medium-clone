import { JsonValue } from '@prisma/client/runtime/library';

//favourited & favoritedCount will be implement later
export interface Article {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: JsonValue | null;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: number;
    email: string;
    username: string;
    bio: string | null;
    image: string | null;
  };
}

export interface ArticleResponse {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  author: {
    username: string;
    bio: string;
    image: string | null;
  };
}
