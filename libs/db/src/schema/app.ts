/**
 * Application tables.
 *
 * Mirrors the Supabase schema built by supabase/migrations/001-012 so that
 * production data can be copied across 1:1 at cutover. Table and column names
 * are kept identical on purpose.
 *
 * Differences from the Supabase migrations (intentional):
 * - No RLS policies. Authorization moves into server code (see Phase 2).
 * - No trigger on auth.users. Profile creation happens in the auth layer.
 * - profiles.department_id is integer (the Supabase migration declared uuid,
 *   but departments.id is serial and the app treats it as a number).
 * - members is defined here; the Supabase migrations only ALTER it.
 *   TODO(schema-dump): reconcile members columns with the live database.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  date,
  decimal,
  index,
  integer,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const ROLES = ['member', 'dept_head', 'admin', 'super_admin'] as const;
export type Role = (typeof ROLES)[number];

/* ─── Departments ─────────────────────────────────────────── */

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  nameEn: text('name_en').notNull(),
  nameAm: text('name_am').notNull(),
  createdAt: createdAt(),
});

/* ─── Profiles (one per login account) ───────────────────── */

export const profiles = pgTable(
  'profiles',
  {
    // Same id as the auth user. FK to the auth user table is added in step 0.2.
    id: uuid('id').primaryKey(),
    displayName: text('display_name'),
    fullName: text('full_name'),
    role: text('role').$type<Role>().notNull().default('member'),
    departmentId: integer('department_id').references(() => departments.id),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      'profiles_role_check',
      sql`${t.role} in ('member', 'dept_head', 'admin', 'super_admin')`,
    ),
  ],
);

/* ─── Members (parish register) ──────────────────────────── */

export const members = pgTable(
  'members',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    memberId: text('member_id').notNull().unique(),
    sundaySchoolId: integer('sunday_school_id'),
    memberTypeId: integer('member_type_id'),
    memberState: text('member_state'),
    status: text('status'),
    // Kept as text until the live schema is confirmed (dates may be Ethiopian calendar).
    registrationDate: text('registration_date'),
    title: text('title'),
    name: text('name').notNull(),
    fatherName: text('father_name'),
    grandfatherName: text('grandfather_name'),
    motherFullName: text('mother_full_name'),
    godName: text('god_name'),
    birthDate: text('birth_date'),
    gender: text('gender'),
    maritalStatus: text('marital_status'),
    addressCity: text('address_city'),
    addressSubCity: text('address_sub_city'),
    addressPhone: text('address_phone'),
    addressEmail: text('address_email'),
    // Login account linked through the /claim flow.
    authUserId: uuid('auth_user_id').unique(),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_members_auth_user_id').on(t.authUserId)],
);

/* ─── Songbook ───────────────────────────────────────────── */

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  emoji: text('emoji'),
  color: text('color'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const songs = pgTable('songs', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: integer('number').notNull().unique(),
  title: text('title').notNull(),
  titleEn: text('title_en'),
  category: text('category')
    .notNull()
    .references(() => categories.name),
  lyrics: text('lyrics').notNull(),
  audioUrl: text('audio_url'),
  createdAt: createdAt(),
});

/* ─── Events & attendance ────────────────────────────────── */

export const RECURRENCES = ['weekly', 'biweekly', 'monthly'] as const;
export type Recurrence = (typeof RECURRENCES)[number];

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    eventDate: date('event_date').notNull(),
    startTime: time('start_time'),
    endTime: time('end_time'),
    departmentId: integer('department_id').references(() => departments.id),
    createdBy: uuid('created_by').references(() => profiles.id),
    createdAt: createdAt(),
    // Shared id linking all occurrences of one recurring series.
    recurrenceGroup: uuid('recurrence_group'),
    recurrence: text('recurrence').$type<Recurrence>(),
    // Current end date of the series (<= 12 months from start, enforced in app).
    recurrenceUntil: date('recurrence_until'),
  },
  (t) => [
    check(
      'events_recurrence_check',
      sql`${t.recurrence} is null or ${t.recurrence} in ('weekly', 'biweekly', 'monthly')`,
    ),
    index('idx_events_department_id').on(t.departmentId),
    index('idx_events_date').on(t.eventDate.desc()),
    index('idx_events_recurrence_group')
      .on(t.recurrenceGroup)
      .where(sql`${t.recurrenceGroup} is not null`),
  ],
);

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    memberId: bigint('member_id', { mode: 'number' })
      .notNull()
      .references(() => members.id),
    status: text('status').$type<AttendanceStatus>().notNull(),
    markedBy: uuid('marked_by').references(() => profiles.id),
    createdAt: createdAt(),
  },
  (t) => [
    unique('attendance_event_id_member_id_key').on(t.eventId, t.memberId),
    check('attendance_status_check', sql`${t.status} in ('present', 'absent', 'late')`),
    index('idx_attendance_event_id').on(t.eventId),
    index('idx_attendance_member_id').on(t.memberId),
  ],
);

/* ─── Donations ──────────────────────────────────────────── */

export const PAYMENT_METHODS = ['bank_transfer', 'telebirr', 'cash', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const DONATION_STATUSES = ['pending', 'verified', 'rejected'] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const donations = pgTable(
  'donations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    donorId: uuid('donor_id')
      .notNull()
      .references(() => profiles.id),
    // Returned as a string by the driver to avoid floating point errors.
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').default('ETB'),
    paymentMethod: text('payment_method').$type<PaymentMethod>(),
    // Storage key of the receipt file, e.g. "<user id>/<file name>".
    receiptUrl: text('receipt_url'),
    notes: text('notes'),
    status: text('status').$type<DonationStatus>().notNull().default('pending'),
    verifiedBy: uuid('verified_by').references(() => profiles.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      'donations_payment_method_check',
      sql`${t.paymentMethod} in ('bank_transfer', 'telebirr', 'cash', 'other')`,
    ),
    check('donations_status_check', sql`${t.status} in ('pending', 'verified', 'rejected')`),
    index('idx_donations_donor_id').on(t.donorId),
    index('idx_donations_status').on(t.status),
  ],
);
