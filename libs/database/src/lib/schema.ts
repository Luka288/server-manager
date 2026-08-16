import { pgTable, text, integer } from 'drizzle-orm/pg-core';

export const servers = pgTable('servers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  memoryMb: integer('memory_mb').notNull(),
  jarFile: text('jar_file').notNull(),
  serverDirectory: text('server_directory').notNull(),
  version: text('version'),
  status: text('status').notNull(),
});
