import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const migrations = [
  '../prisma/migrations/20260512181304_init/migration.sql',
  '../prisma/migrations/20260519042721_add_social_features/migration.sql',
];

for (const file of migrations) {
  const sql = readFileSync(join(__dirname, file), 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (e) {
      if (!e.message.includes('already exists')) {
        console.error('Error en:', stmt.slice(0, 60));
        console.error(e.message);
      }
    }
  }
  console.log('✓', file.split('/').pop());
}

console.log('Migraciones aplicadas.');
client.close();
