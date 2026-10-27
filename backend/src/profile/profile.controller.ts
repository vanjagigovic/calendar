import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiErrorResponseDto } from '../common/dto/api-error-response-dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({
    description: 'Profile retrieved successfully.',
    type: ProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    type: ApiErrorResponseDto,
  })
  findOne(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.findOne(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Create or update the authenticated user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({
    description: 'Profile saved successfully.',
    type: ProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    type: ApiErrorResponseDto,
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.update(user.id, dto);
  }
}
