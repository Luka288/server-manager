import { jsonb } from 'drizzle-orm/pg-core';
import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core';
import type { LaunchSpec, ServerType } from '@game-server/shared/types';

export const servers = pgTable('servers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  memoryMb: integer('memory_mb').notNull(),
  jarFile: text('jar_file'),
  launch: jsonb('launch').$type<LaunchSpec>(),
  loaderVersion: text('loader_version'),
  type: text('type').$type<ServerType>().notNull().default('vanilla'),
  serverDirectory: text('server_directory').notNull(),
  version: text('version'),
  status: text('status').notNull(),
  initialized: boolean('initialized').notNull().default(false),
});
