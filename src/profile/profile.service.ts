import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileResponseDto } from './dto/profile-response.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(
    username: string,
    currentUserId?: number,
  ): Promise<ProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    let isFollowing = false;
    if (currentUserId) {
      const follow = await (this.prisma.follow as any).findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return {
      profile: {
        username: user.username,
        bio: user.bio || '',
        image: user.image,
        following: isFollowing,
      },
    };
  }

  async followUser(
    username: string,
    currentUserId: number,
  ): Promise<ProfileResponseDto> {
    const userToFollow = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!userToFollow) {
      throw new NotFoundException('Profile not found');
    }

    if (userToFollow.id === currentUserId) {
      throw new Error('You cannot follow yourself');
    }

    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userToFollow.id,
        },
      },
      update: {},
      create: {
        followerId: currentUserId,
        followingId: userToFollow.id,
      },
    });

    return {
      profile: {
        username: userToFollow.username,
        bio: userToFollow.bio || '',
        image: userToFollow.image,
        following: true,
      },
    };
  }

  async unfollowUser(
    username: string,
    currentUserId: number,
  ): Promise<ProfileResponseDto> {
    const userToUnfollow = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!userToUnfollow) {
      throw new NotFoundException('Profile not found');
    }

    await (this.prisma.follow as any).deleteMany({
      where: {
        followerId: currentUserId,
        followingId: userToUnfollow.id,
      },
    });

    return {
      profile: {
        username: userToUnfollow.username,
        bio: userToUnfollow.bio || '',
        image: userToUnfollow.image,
        following: false,
      },
    };
  }
}
