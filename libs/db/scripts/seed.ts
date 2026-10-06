/**
 * Seeds a local development database with safe sample data.
 * Idempotent: running it twice does not duplicate rows.
 *
 *   pnpm db:seed
 */
import './load-env';
import { hashPassword } from 'better-auth/crypto';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/schema';
import { seedCategories, seedDepartments, seedSongs } from './seed-data';

const url = process.env['DATABASE_URL'];
if (!url)
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env.local first.',
  );
if (/supabase\.co|prod/i.test(url)) {
  throw new Error('Refusing to seed what looks like a production database.');
}

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

// Fictional members for local testing only.
const sampleMembers = [
  [1, 'FY-0001', 'አበበ', 'በቀለ', 'ወንድ'],
  [2, 'FY-0002', 'ሰላም', 'ተስፋዬ', 'ሴት'],
  [3, 'FY-0003', 'ዮሐንስ', 'ገብሩ', 'ወንድ'],
  [4, 'FY-0004', 'ማርታ', 'ደስታ', 'ሴት'],
  [5, 'FY-0005', 'ሚካኤል', 'ኃይሉ', 'ወንድ'],
  [6, 'FY-0006', 'ሄለን', 'ታደሰ', 'ሴት'],
  [7, 'FY-0007', 'ዳዊት', 'አለሙ', 'ወንድ'],
  [8, 'FY-0008', 'ቤተልሔም', 'ወልዴ', 'ሴት'],
  [9, 'FY-0009', 'ናትናኤል', 'ሙሉጌታ', 'ወንድ'],
  [10, 'FY-0010', 'ኤልሳቤጥ', 'ካሳ', 'ሴት'],
] as const;

// One login per role, all with TEST_PASSWORD.
// `member` links the login to a member record. member@ stays unlinked so
// the /claim flow can be tested.
const TEST_PASSWORD = 'password123';
const testAccounts = [
  {
    n: 1,
    email: 'member@felege.test',
    name: 'Test Member',
    role: 'member',
    departmentId: null,
    member: null,
  },
  {
    n: 2,
    email: 'songs.head@felege.test',
    name: 'Songs Dept Head',
    role: 'dept_head',
    departmentId: 6,
    member: 2,
  },
  {
    n: 3,
    email: 'budget.head@felege.test',
    name: 'Budget Dept Head',
    role: 'dept_head',
    departmentId: 9,
    member: 3,
  },
  {
    n: 4,
    email: 'events.head@felege.test',
    name: 'Programs Dept Head',
    role: 'dept_head',
    departmentId: 3,
    member: 4,
  },
  {
    n: 5,
    email: 'admin@felege.test',
    name: 'Test Admin',
    role: 'admin',
    departmentId: null,
    member: 5,
  },
  {
    n: 6,
    email: 'superadmin@felege.test',
    name: 'Test Super Admin',
    role: 'super_admin',
    departmentId: null,
    member: null,
  },
] as const;
const userId = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

function isoDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

async function main() {
  await db
    .insert(schema.departments)
    .values(seedDepartments)
    .onConflictDoNothing();
  await db
    .insert(schema.categories)
    .values(seedCategories)
    .onConflictDoNothing();
  await db.insert(schema.songs).values(seedSongs).onConflictDoNothing();

  await db
    .insert(schema.members)
    .values(
      sampleMembers.map(([id, memberId, name, fatherName, gender]) => ({
        id,
        memberId,
        name,
        fatherName,
        gender,
      })),
    )
    .onConflictDoNothing();

  // Logins (Better Auth tables) + profiles.
  const passwordHash = await hashPassword(TEST_PASSWORD);
  for (const a of testAccounts) {
    const id = userId(a.n);
    await db
      .insert(schema.authUsers)
      .values({ id, email: a.email, name: a.name, emailVerified: true })
      .onConflictDoNothing();
    await db
      .insert(schema.authAccounts)
      .values({
        id,
        userId: id,
        accountId: id,
        providerId: 'credential',
        password: passwordHash,
      })
      .onConflictDoNothing();
    await db
      .insert(schema.profiles)
      .values({
        id,
        role: a.role,
        departmentId: a.departmentId,
        displayName: a.name,
      })
      .onConflictDoNothing();
    if (a.member) {
      await db
        .update(schema.members)
        .set({ authUserId: id })
        .where(eq(schema.members.id, a.member));
    }
  }

  // Events, attendance and donations: only on a fresh database.
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.events);
  if (count === 0) {
    const [past, , rehearsal] = await db
      .insert(schema.events)
      .values([
        {
          title: 'የትምህርት ክፍለ ጊዜ',
          eventDate: isoDate(-5),
          startTime: '09:00',
          endTime: '10:30',
          departmentId: 2,
          createdBy: userId(5),
        },
        {
          title: 'የሰንበት ጉባኤ',
          eventDate: isoDate(2),
          startTime: '08:00',
          endTime: '11:00',
          departmentId: 3,
          createdBy: userId(4),
        },
        {
          title: 'የመዝሙር ልምምድ',
          eventDate: isoDate(-2),
          startTime: '16:00',
          endTime: '18:00',
          departmentId: 6,
          createdBy: userId(2),
        },
      ])
      .returning();

    await db.insert(schema.attendance).values([
      { eventId: past.id, memberId: 2, status: 'present', markedBy: userId(5) },
      { eventId: past.id, memberId: 3, status: 'late', markedBy: userId(5) },
      { eventId: past.id, memberId: 5, status: 'absent', markedBy: userId(5) },
      {
        eventId: rehearsal.id,
        memberId: 2,
        status: 'present',
        markedBy: userId(2),
      },
      {
        eventId: rehearsal.id,
        memberId: 6,
        status: 'present',
        markedBy: userId(2),
      },
    ]);

    await db.insert(schema.donations).values([
      {
        donorId: userId(1),
        amount: '500.00',
        paymentMethod: 'telebirr',
        status: 'pending',
        notes: 'ለአዳራሽ ግንባታ',
      },
      {
        donorId: userId(2),
        amount: '1000.00',
        paymentMethod: 'bank_transfer',
        status: 'verified',
        verifiedBy: userId(3),
        verifiedAt: new Date(),
      },
      {
        donorId: userId(5),
        amount: '250.00',
        paymentMethod: 'cash',
        status: 'rejected',
        rejectionReason: 'Receipt is unreadable',
        verifiedBy: userId(3),
        verifiedAt: new Date(),
      },
    ]);
  }

  console.log('Seed complete.');
  console.log(`Test logins (password "${TEST_PASSWORD}"):`);
  for (const a of testAccounts)
    console.log(`  ${a.role.padEnd(12)} ${a.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
