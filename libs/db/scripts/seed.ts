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
if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local first.');
if (/supabase\.co|prod/i.test(url)) {
  throw new Error('Refusing to seed what looks like a production database.');
}

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

// Fictional members for local testing only.
const sampleMembers = [
  ['FY-0001', 'አበበ', 'በቀለ', 'M'],
  ['FY-0002', 'ሰላም', 'ተስፋዬ', 'F'],
  ['FY-0003', 'ዮሐንስ', 'ገብሩ', 'M'],
  ['FY-0004', 'ማርታ', 'ደስታ', 'F'],
  ['FY-0005', 'ሚካኤል', 'ኃይሉ', 'M'],
  ['FY-0006', 'ሄለን', 'ታደሰ', 'F'],
  ['FY-0007', 'ዳዊት', 'አለሙ', 'M'],
  ['FY-0008', 'ቤተልሔም', 'ወልዴ', 'F'],
  ['FY-0009', 'ናትናኤል', 'ሙሉጌታ', 'M'],
  ['FY-0010', 'ኤልሳቤጥ', 'ካሳ', 'F'],
] as const;

function isoDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

async function main() {
  await db.insert(schema.departments).values(seedDepartments).onConflictDoNothing();
  // Explicit ids bypass the serial sequence; move it past the seeded ids.
  await db.execute(
    sql`select setval(pg_get_serial_sequence('departments', 'id'), (select max(id) from departments))`,
  );

  await db.insert(schema.categories).values(seedCategories).onConflictDoNothing();
  await db.insert(schema.songs).values(seedSongs).onConflictDoNothing();

  await db
    .insert(schema.members)
    .values(
      sampleMembers.map(([memberId, name, fatherName, gender]) => ({
        memberId,
        name,
        fatherName,
        gender,
        status: 'active',
      })),
    )
    .onConflictDoNothing();

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.events);
  if (count === 0) {
    await db.insert(schema.events).values([
      { title: 'የሰንበት ጉባኤ', eventDate: isoDate(2), startTime: '08:00', endTime: '11:00', departmentId: 3 },
      { title: 'የመዝሙር ልምምድ', eventDate: isoDate(4), startTime: '16:00', endTime: '18:00', departmentId: 6 },
      { title: 'የትምህርት ክፍለ ጊዜ', eventDate: isoDate(-5), startTime: '09:00', endTime: '10:30', departmentId: 2 },
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
