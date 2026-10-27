import { relations, sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  check,
  boolean,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userProfilesTable = pgTable('user_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  profession: text('profession'),
  interests: text('interests')
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  responseStyle: text('response_style').notNull().default('balanced'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sessionsTable = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  },
  (table) => ({
    expiresAtIndex: index('sessions_expires_at_idx').on(table.expiresAt),
  }),
);

export const eventsTable = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => usersTable.id, {
      onDelete: 'cascade',
    }),
    title: text('title').notNull(),
    startUtc: timestamp('start_time', { withTimezone: true }).notNull(),
    endUtc: timestamp('end_time', { withTimezone: true }).notNull(),
    isAllDay: boolean('is_all_day').default(false).notNull(),
    timeZone: text('time_zone').notNull(),
    eventType: text('event_type').notNull(),
    reminderEnabled: boolean('reminder_enabled').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    repeatWeekly: boolean('repeat_weekly').default(false).notNull(),
    repeatUntilUtc: timestamp('repeat_until_utc', { withTimezone: true }),
  },
  (table) => ({
    userStartUtcIndex: index('events_user_id_start_utc_idx').on(
      table.userId,
      table.startUtc,
    ),
    validTimeRange: check(
      'events_valid_time_range_chk',
      sql`${table.endUtc} > ${table.startUtc}`,
    ),
    validRepeateBoundary: check(
      'events_valid_repeat_boundary_chk',
      sql`${table.repeatUntilUtc} IS NULL OR ${table.repeatUntilUtc} >= ${table.startUtc}`,
    ),
  }),
);

export const usersRelations = relations(usersTable, ({ many, one }) => ({
  events: many(eventsTable),
  sessions: many(sessionsTable),
  profile: one(userProfilesTable, {
    fields: [usersTable.id],
    references: [userProfilesTable.userId],
  }),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));

export const eventsRelations = relations(eventsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [eventsTable.userId],
    references: [usersTable.id],
  }),
}));

export type EventRecord = typeof eventsTable.$inferSelect;
export type NewEventRecord = typeof eventsTable.$inferInsert;
export type UserRecord = typeof usersTable.$inferSelect;
export type NewUserRecord = typeof usersTable.$inferInsert;
export type SessionRecord = typeof sessionsTable.$inferSelect;
export type NewSessionRecord = typeof sessionsTable.$inferInsert;
export type UserProfileRecord = typeof userProfilesTable.$inferSelect;
export type NewUserProfileRecord = typeof userProfilesTable.$inferInsert;
