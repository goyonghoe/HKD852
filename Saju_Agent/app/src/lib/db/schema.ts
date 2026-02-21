import { pgTable, uuid, varchar, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: varchar("payment_id", { length: 255 }).unique(),
  sajuInput: jsonb("saju_input").notNull(),
  sajuResult: jsonb("saju_result"),
  amount: integer("amount").notNull().default(990),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  readingCache: text("reading_cache"),
  shareId: varchar("share_id", { length: 12 }).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});
