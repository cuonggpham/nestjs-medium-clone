import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserResponse } from './interfaces/user.interface';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
  ): Promise<{ user: UserResponse }> {
    const { email, username, password } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    const token = this.generateToken(user);
    return {
      user: {
        ...this.excludePassword(user),
        token,
      },
    };
  }

  async login(loginUserDto: LoginUserDto): Promise<{ user: UserResponse }> {
    const { email, password } = loginUserDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);

    return {
      user: {
        ...this.excludePassword(user),
        token,
      },
    };
  }

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

    // Check if email or username already exists (excluding current user)
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

    // Prepare update data
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

    const token = this.generateToken(updatedUser);

    return {
      user: {
        ...this.excludePassword(updatedUser),
        token,
      },
    };
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
    return this.jwtService.sign(payload);
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
