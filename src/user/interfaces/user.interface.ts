export interface User {
  id: number;
  email: string;
  username: string;
  password: string;
  bio?: string | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  bio: string;
  image: string | null;
  token?: string;
}
