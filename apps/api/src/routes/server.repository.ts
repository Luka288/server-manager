import { db, servers as serversTable } from '@game-server/database';
import { eq } from 'drizzle-orm';

export type ServerRow = typeof serversTable.$inferSelect;
export type NewServerRow = typeof serversTable.$inferInsert;

/** All database access for the `servers` table lives here. */
export const serversRepository = {
  async findById(id: string): Promise<ServerRow | null> {
    const [row] = await db
      .select()
      .from(serversTable)
      .where(eq(serversTable.id, id));

    return row ?? null;
  },

  async insert(values: NewServerRow): Promise<void> {
    await db.insert(serversTable).values(values);
  },

  /** Returns the updated rows (empty array if the id doesn't exist). */
  update(id: string, values: Partial<NewServerRow>) {
    return db
      .update(serversTable)
      .set(values)
      .where(eq(serversTable.id, id))
      .returning();
  },

  async delete(id: string): Promise<void> {
    await db.delete(serversTable).where(eq(serversTable.id, id));
  },
};
