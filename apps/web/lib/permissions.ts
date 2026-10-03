/**
 * Who may do what. Single source of truth for authorization.
 *
 * These rules replace the Supabase RLS policies one for one. Every server
 * action and every page that reads or writes data must check the matching
 * rule here before touching the database. Hiding a button is not security.
 *
 * Phase 4 replaces the hardcoded department ids with configurable permissions.
 */
import type { CurrentUser } from './session';

/** Department ids that carry special permissions (see departments table). */
export const DEPARTMENT = {
  /** Programs & Events: can read all attendance. */
  PROGRAMS_EVENTS: 3,
  /** Songs & Celebrations: manages the songbook. */
  SONGS: 6,
  /** Budget & Asset Management: verifies donations and reads receipts. */
  BUDGET: 9,
} as const;

type User = Pick<CurrentUser, 'id' | 'role' | 'departmentId'>;

export const isAdmin = (u: User) =>
  u.role === 'admin' || u.role === 'super_admin';
export const isSuperAdmin = (u: User) => u.role === 'super_admin';
export const isDeptHeadOf = (
  u: User,
  departmentId: number | null | undefined,
) =>
  u.role === 'dept_head' &&
  departmentId != null &&
  u.departmentId === departmentId;

/** Admin area (/admin): everyone except plain members. */
export const canAccessAdmin = (u: User) => u.role !== 'member';

/* ─── Songbook ─────────────────────────────────────────────── */

/** Create, edit and delete songs and categories. Reading is open to all users. */
export const canManageSongs = (u: User) =>
  isAdmin(u) || isDeptHeadOf(u, DEPARTMENT.SONGS);

/* ─── Events ───────────────────────────────────────────────── */

/** Create an event for `departmentId` (dept heads only for their own department). */
export const canCreateEvent = (u: User, departmentId: number | null) =>
  isAdmin(u) || isDeptHeadOf(u, departmentId);

/** Edit or delete an existing event: its creator or an admin. */
export const canEditEvent = (u: User, event: { createdBy: string | null }) =>
  isAdmin(u) || event.createdBy === u.id;

/* ─── Attendance ───────────────────────────────────────────── */

/** Mark or change attendance for an event. */
export const canMarkAttendance = (
  u: User,
  event: { departmentId: number | null },
) => isAdmin(u) || isDeptHeadOf(u, event.departmentId);

/** Read attendance of every event (any role in Programs & Events, or admins). */
export const canViewAllAttendance = (u: User) =>
  isAdmin(u) || u.departmentId === DEPARTMENT.PROGRAMS_EVENTS;

/** Read attendance of one event. Members can always read their own records. */
export const canViewEventAttendance = (
  u: User,
  event: { departmentId: number | null },
) => canViewAllAttendance(u) || canMarkAttendance(u, event);

/* ─── Donations ────────────────────────────────────────────── */

/** See all donations, verify or reject them, open any receipt. */
export const canReviewDonations = (u: User) =>
  isAdmin(u) || isDeptHeadOf(u, DEPARTMENT.BUDGET);

/**
 * Strict shape of a receipt key: "<donor user id>/<file name>".
 * Rejects anything else ("..", extra folders, encoded separators) so a key can
 * never point into another user's folder.
 */
const RECEIPT_KEY = /^[0-9a-f-]{36}\/[A-Za-z0-9_-]+\.[a-z0-9]{2,5}$/;
export const isValidReceiptKey = (receiptKey: string) =>
  RECEIPT_KEY.test(receiptKey);

/** Open a receipt file. Receipt keys start with the donor's user id. */
export const canViewReceipt = (u: User, receiptKey: string) =>
  isValidReceiptKey(receiptKey) &&
  (receiptKey.startsWith(`${u.id}/`) || canReviewDonations(u));

/* ─── Users & members ──────────────────────────────────────── */

/** Change anyone's role or department. */
export const canManageUsers = (u: User) => isSuperAdmin(u);

/** See all profiles (user list). */
export const canViewAllProfiles = (u: User) => isAdmin(u);

/** Edit any member record (claiming your own unclaimed record is always allowed). */
export const canEditMembers = (u: User) => isAdmin(u);
