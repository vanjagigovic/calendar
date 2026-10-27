import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../db/db.module';
import { userProfilesTable } from '../db/schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@Injectable()
export class ProfileService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async findOne(userId: string): Promise<ProfileResponseDto> {
    const [profile] = await this.db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId))
      .limit(1);

    if (!profile) {
      return {
        userId,
        profession: null,
        interests: [],
        responseStyle: 'balanced',
        createdAt: null,
        updatedAt: null,
      };
    }

    return profile;
  }

  async update(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const now = new Date();

    const insertValues = {
      userId,
      profession: dto.profession ?? null,
      interests: dto.interests ?? [],
      responseStyle: dto.responseStyle ?? 'balanced',
      createdAt: now,
      updatedAt: now,
    };

    const updateValues = {
      ...(dto.profession !== undefined && {
        profession: dto.profession,
      }),
      ...(dto.interests !== undefined && {
        interests: dto.interests,
      }),
      ...(dto.responseStyle !== undefined && {
        responseStyle: dto.responseStyle,
      }),
      updatedAt: now,
    };

    const [profile] = await this.db
      .insert(userProfilesTable)
      .values(insertValues)
      .onConflictDoUpdate({
        target: userProfilesTable.userId,
        set: updateValues,
      })
      .returning();

    return profile;
  }
}
