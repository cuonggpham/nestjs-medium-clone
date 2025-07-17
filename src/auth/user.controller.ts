import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UpdateUserRequestDto } from './dto/update-user-request.dto';

@Controller('user')
export class UserController {
  constructor(private authService: AuthService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user.id);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  updateUser(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateUserRequest: UpdateUserRequestDto,
  ) {
    return this.authService.updateUser(user.id, updateUserRequest.user);
  }
}
