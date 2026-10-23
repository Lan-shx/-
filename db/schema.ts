// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const researchTurns = sqliteTable("research_turns", {
  id: text("id").primaryKey(), sid: text("sid").notNull(),
  payload: text("payload").notNull(), status: text("status").notNull(),
  expires: integer("expires").notNull(),
});
