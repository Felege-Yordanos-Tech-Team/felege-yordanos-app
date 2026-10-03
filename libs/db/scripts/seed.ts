/**
 * Seeds a local development database with safe sample data.
 * Idempotent: running it twice does not duplicate rows.
 *
 *   pnpm db:seed
 */
import './load-env';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
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

// One login per role. Password for all: see TEST_PASSWORD below.
// Hashed with bcrypt, the same format Supabase uses, so the
// Supabase-compatible password check is exercised in development.
const TEST_PASSWORD = 'password123';
const testAccounts = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'member@felege.test',
    name: 'Test Member',
    role: 'member',
    departmentId: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'songs.head@felege.test',
    name: 'Songs Dept Head',
    role: 'dept_head',
    departmentId: 6,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    email: 'budget.head@felege.test',
    name: 'Budget Dept Head',
    role: 'dept_head',
    departmentId: 9,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    email: 'events.head@felege.test',
    name: 'Programs Dept Head',
    role: 'dept_head',
    departmentId: 3,
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    email: 'admin@felege.test',
    name: 'Test Admin',
    role: 'admin',
    departmentId: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    email: 'superadmin@felege.test',
    name: 'Test Super Admin',
    role: 'super_admin',
    departmentId: null,
  },
] as const;

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

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.events);
  if (count === 0) {
    await db.insert(schema.events).values([
      {
        title: 'የሰንበት ጉባኤ',
        eventDate: isoDate(2),
        startTime: '08:00',
        endTime: '11:00',
        departmentId: 3,
      },
      {
        title: 'የመዝሙር ልምምድ',
        eventDate: isoDate(4),
        startTime: '16:00',
        endTime: '18:00',
        departmentId: 6,
      },
      {
        title: 'የትምህርት ክፍለ ጊዜ',
        eventDate: isoDate(-5),
        startTime: '09:00',
        endTime: '10:30',
        departmentId: 2,
      },
    ]);
  }

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  for (const account of testAccounts) {
    await db
      .insert(schema.authUsers)
      .values({
        id: account.id,
        email: account.email,
        name: account.name,
        emailVerified: true,
      })
      .onConflictDoNothing();
    await db
      .insert(schema.authAccounts)
      .values({
        id: account.id,
        userId: account.id,
        accountId: account.id,
        providerId: 'credential',
        password: passwordHash,
      })
      .onConflictDoNothing();
    await db
      .insert(schema.profiles)
      .values({
        id: account.id,
        role: account.role,
        departmentId: account.departmentId,
        displayName: account.name,
      })
      .onConflictDoNothing();
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
