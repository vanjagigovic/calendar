import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { and, eq, isNull, isNotNull, lte, or } from 'drizzle-orm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHash, randomBytes } from 'node:crypto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../db/db.module';
import { sessionsTable, usersTable } from '../db/schema';
import { env } from '../config/env';
import { LoginAuthDto } from './dto/login-auth-dto';
import { RegisterAuthDto } from './dto/register-auth-dto';
import { AuthSession, AuthUser } from './auth.types';
import { PasswordService } from './password.service';
import { getCorrelationId } from '../common/request-context';

type SecurityEventType = 'registration' | 'login' | 'refresh' | 'logout';
type SecurityEventOutcome = 'succeeded' | 'rejected' | 'completed';
type SecurityEventReason =
  | 'duplicate_email'
  | 'invalid_credentials'
  | 'missing_refresh_token'
  | 'unknown_refresh_token'
  | 'revoked_refresh_token'
  | 'expired_refresh_token'
  | 'missing_session_user'
  | 'refresh_token_reuse'
  | 'no_refresh_token'
  | 'session_revoked'
  | 'no_active_session';

type SecurityEventMetadata = {
  reason?: SecurityEventReason;
  userId?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  async register(dto: RegisterAuthDto): Promise<AuthSession> {
    const email = this.normalizeEmail(dto.email);
    const [existingUser] = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser) {
      this.logSecurityEvent('registration', 'rejected', {
        reason: 'duplicate_email',
      });
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const [user] = await this.db
      .insert(usersTable)
      .values({ email, passwordHash })
      .returning({ id: usersTable.id, email: usersTable.email });

    const session = await this.createAuthSession(user);
    this.logSecurityEvent('registration', 'succeeded', { userId: user.id });
    return session;
  }

  async login(dto: LoginAuthDto): Promise<AuthSession> {
    const email = this.normalizeEmail(dto.email);
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.email, email)))
      .limit(1);

    if (
      !user ||
      !(await this.passwordService.verify(dto.password, user.passwordHash))
    ) {
      this.logSecurityEvent('login', 'rejected', {
        reason: 'invalid_credentials',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const session = await this.createAuthSession({
      id: user.id,
      email: user.email,
    });
    this.logSecurityEvent('login', 'succeeded', { userId: user.id });
    return session;
  }

  async refresh(refreshToken: string | undefined): Promise<AuthSession> {
    if (!refreshToken) {
      this.logSecurityEvent('refresh', 'rejected', {
        reason: 'missing_refresh_token',
      });
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.hashRefreshToken(refreshToken);
    const [session] = await this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.tokenHash, tokenHash))
      .limit(1);

    if (!session) {
      this.logSecurityEvent('refresh', 'rejected', {
        reason: 'unknown_refresh_token',
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.revokedAt) {
      this.logSecurityEvent('refresh', 'rejected', {
        reason: 'revoked_refresh_token',
        userId: session.userId,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.expiresAt <= new Date()) {
      this.logSecurityEvent('refresh', 'rejected', {
        reason: 'expired_refresh_token',
        userId: session.userId,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const [user] = await this.db
      .select({ id: usersTable.id, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, session.userId))
      .limit(1);

    if (!user) {
      this.logSecurityEvent('refresh', 'rejected', {
        reason: 'missing_session_user',
        userId: session.userId,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const [revokedSession] = await this.db
      .update(sessionsTable)
      .set({ revokedAt: new Date(), lastUsedAt: new Date() })
      .where(
        and(eq(sessionsTable.id, session.id), isNull(sessionsTable.revokedAt)),
      )
      .returning({ id: sessionsTable.id });

    if (!revokedSession) {
      this.logSecurityEvent('refresh', 'rejected', {
        reason: 'refresh_token_reuse',
        userId: session.userId,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const nextSession = await this.createAuthSession(user);
    this.logSecurityEvent('refresh', 'succeeded', { userId: user.id });
    return nextSession;
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      this.logSecurityEvent('logout', 'completed', {
        reason: 'no_refresh_token',
      });
      return;
    }

    const [revokedSession] = await this.db
      .update(sessionsTable)
      .set({ revokedAt: new Date(), lastUsedAt: new Date() })
      .where(
        and(
          eq(sessionsTable.tokenHash, this.hashRefreshToken(refreshToken)),
          isNull(sessionsTable.revokedAt),
        ),
      )
      .returning({ id: sessionsTable.id, userId: sessionsTable.userId });

    this.logSecurityEvent('logout', 'completed', {
      reason: revokedSession ? 'session_revoked' : 'no_active_session',
      userId: revokedSession?.userId,
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await this.db
        .delete(sessionsTable)
        .where(
          or(
            lte(sessionsTable.expiresAt, new Date()),
            isNotNull(sessionsTable.revokedAt),
          ),
        )
        .returning({ id: sessionsTable.id });

      this.logger.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          message: 'Session cleanup completed',
          deletedCount: result.length,
        }),
      );
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          message: 'Session cleanup failed',
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
        }),
      );
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async createAuthSession(user: AuthUser): Promise<AuthSession> {
    const accessToken = await this.jwtService.signAsync({ sub: user.id });
    const refreshToken = randomBytes(32).toString('base64url');
    const now = new Date();

    await this.db.insert(sessionsTable).values({
      userId: user.id,
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: new Date(
        now.getTime() + env.JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
      ),
    });

    return { user, accessToken, refreshToken };
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private logSecurityEvent(
    eventType: SecurityEventType,
    outcome: SecurityEventOutcome,
    metadata: SecurityEventMetadata = {},
  ): void {
    const correlationId = getCorrelationId();
    const payload = {
      ...(correlationId && { correlationId }),
      eventType,
      timestamp: new Date().toISOString(),
      outcome,
      ...(metadata.reason !== undefined ? { reason: metadata.reason } : {}),
      ...(metadata.userId !== undefined ? { userId: metadata.userId } : {}),
    };

    this.logger.log(JSON.stringify(payload));
  }
}
