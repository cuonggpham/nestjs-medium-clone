import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: number;
  email: string;
  username: string;
}

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get(':username')
  async getProfile(
    @Param('username') username: string,
    @Headers('authorization') authHeader?: string,
  ): Promise<ProfileResponseDto> {
    let currentUserId: number | undefined;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = this.jwtService.verify<JwtPayload>(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
        currentUserId = payload.sub;
      } catch {
        currentUserId = undefined;
      }
    }

    return this.profileService.getProfile(username, currentUserId);
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  async followUser(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProfileResponseDto> {
    return this.profileService.followUser(username, user.id);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  async unfollowUser(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProfileResponseDto> {
    return this.profileService.unfollowUser(username, user.id);
  }
}
