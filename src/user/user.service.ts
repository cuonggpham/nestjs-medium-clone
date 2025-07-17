import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserResponse } from './interfaces/user.interface';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getCurrentUser(userId: number): Promise<{ user: UserResponse }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user: this.excludePassword(user),
    };
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<{ user: UserResponse }> {
    const { email, username, password, bio, image } = updateUserDto;

    if (email || username) {
      const conditions: Array<{ email?: string; username?: string }> = [];
      if (email) conditions.push({ email });
      if (username) conditions.push({ username });

      const existingUser = await this.prisma.user.findFirst({
        where: {
          AND: [{ id: { not: userId } }, { OR: conditions }],
        },
      });

      if (existingUser) {
        throw new ConflictException('Email or username already exists');
      }
    }

    const updateData: {
      email?: string;
      username?: string;
      password?: string;
      bio?: string;
      image?: string;
    } = {};

    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (image !== undefined) updateData.image = image;
    if (password !== undefined) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      user: this.excludePassword(updatedUser),
    };
  }

  private excludePassword(user: User): UserResponse {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, createdAt, updatedAt, ...result } = user;
    return {
      ...result,
      bio: result.bio || '',
      image: result.image || null,
    };
  }
}
