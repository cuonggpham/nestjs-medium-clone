import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UpdateUserRequestDto } from './dto/update-user-request.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getCurrentUser(user.id);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  updateUser(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateUserRequest: UpdateUserRequestDto,
  ) {
    return this.userService.updateUser(user.id, updateUserRequest.user);
  }
}
