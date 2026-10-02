/**
 * Seeds a local development database with safe sample data.
 * Idempotent: running it twice does not duplicate rows.
 *
 *   pnpm db:seed
 */
import './load-env';
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

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
