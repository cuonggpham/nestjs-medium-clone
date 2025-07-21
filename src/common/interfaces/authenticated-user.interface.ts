export interface AuthenticatedUser {
  id: number;
  email: string;
  username: string;
  bio?: string | null;
  image?: string | null;
}
