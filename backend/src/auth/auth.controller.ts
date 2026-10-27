/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { env } from '../config/env';
import { AuthService } from './auth.service';
import { AuthResponse } from './auth.types';
import { LoginAuthDto } from './dto/login-auth-dto';
import { RegisterAuthDto } from './dto/register-auth-dto';
import { AuthResponseDto, LogoutResponseDto } from './dto/auth-response-dto';
import { ApiErrorResponseDto } from '../common/dto/api-error-response-dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a user account and returns an access token. Sets the refresh-token cookie on the auth path.',
  })
  @ApiBody({ type: RegisterAuthDto })
  @ApiCreatedResponse({
    description: 'User registered successfully.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Input validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email is already registered.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The request origin is not allowed.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    type: ApiErrorResponseDto,
  })
  async register(
    @Body() dto: RegisterAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.register(dto);
    this.setRefreshCookie(response, session.refreshToken);
    return this.toPublicResponse(session);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Log in with email and password',
    description:
      'Authenticates a user and returns an access token. Sets the refresh-token cookie on the auth path.',
  })
  @ApiBody({ type: LoginAuthDto })
  @ApiCreatedResponse({
    description: 'User logged in successfully.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Input validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The request origin is not allowed.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    type: ApiErrorResponseDto,
  })
  async login(
    @Body() dto: LoginAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);
    this.setRefreshCookie(response, session.refreshToken);
    return this.toPublicResponse(session);
  }

  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Refresh the access token',
    description:
      'Validates the refresh-token cookie and rotates the session, returning a fresh access token.',
  })
  @ApiCookieAuth(env.REFRESH_TOKEN_COOKIE_NAME)
  @ApiCreatedResponse({
    description: 'Access token refreshed successfully.',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is missing or invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The request origin is not allowed.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    type: ApiErrorResponseDto,
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.refresh(
      request.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME],
    );
    this.setRefreshCookie(response, session.refreshToken);
    return this.toPublicResponse(session);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Log out and revoke the current session',
    description:
      'Revokes the refresh token from the cookie and clears the auth cookie.',
  })
  @ApiCookieAuth(env.REFRESH_TOKEN_COOKIE_NAME)
  @ApiOkResponse({
    description: 'Logout completed successfully.',
    type: LogoutResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The request origin is not allowed.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    type: ApiErrorResponseDto,
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(
      request.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME],
    );
    response.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, this.cookieOptions());
    return { success: true };
  }

  private toPublicResponse(session: AuthResponse & { refreshToken: string }) {
    return { user: session.user, accessToken: session.accessToken };
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(
      env.REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      this.cookieOptions(),
    );
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: env.AUTH_COOKIE_SECURE,
      sameSite: env.AUTH_COOKIE_SAME_SITE,
      path: '/auth',
      maxAge: env.JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
    } as const;
  }
}
