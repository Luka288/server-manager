import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './libs/server/database/src/lib/schema.ts',
  out: './libs/server/database/src/lib/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://postgres:devpassword@localhost:5432/gameserver',
  },
});
