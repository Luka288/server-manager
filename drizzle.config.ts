import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './libs/database/src/lib/schema.ts',
  out: './libs/database/src/lib/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://postgres:devpassword@localhost:5432/gameserver',
  },
});
