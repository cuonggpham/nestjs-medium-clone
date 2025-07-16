import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(userData: { email: string; username: string; password: string }) {
    const { email, username, password } = userData;

    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (exists) {
      throw new ConflictException('Email or username already exists');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashed,
      },
    });

    const { password: _, ...result } = user;
    return { user: result };
  }
}
